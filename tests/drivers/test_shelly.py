import hashlib
from pathlib import Path

import aiohttp
import pytest
import yaml
from aiohttp.test_utils import TestServer

from radiate.config import ShellyConfig, parse_site, parse_week
from radiate.config.household import UseLevel
from radiate.drivers.live import LiveDriver
from radiate.drivers.shelly import (
    DEFAULT_HEATING_WINDOWS,
    HEARTBEAT_KEY,
    BurnerMeter,
    ShellyBoiler,
    ShellyError,
    ShellyRpc,
    SwitchStatus,
    challenge,
    chunks,
    digest_header,
    fallback_heating_windows,
    kvs_windows,
    watchdog_code,
)

from .fake_shelly import FakeShelly

HOUSEHOLD = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"


@pytest.fixture
async def shelly():
    fake = FakeShelly(password="pw")
    server = TestServer(fake.app())
    await server.start_server()
    async with aiohttp.ClientSession() as session:
        fake.host = f"{server.host}:{server.port}"
        fake.session = session
        yield fake
    await server.close()


def boiler(fake, dry_run=False, password="pw"):
    cfg = ShellyConfig(host=fake.host, password=password)
    return ShellyBoiler(cfg, ShellyRpc(fake.host, password, fake.session), dry_run=dry_run)


# --- pure ------------------------------------------------------------------------------


def test_digest_matches_rfc7616_formula():
    chal = challenge('Digest qop="auth", realm="dev1", nonce="abc", algorithm=SHA-256')
    assert chal == {"qop": "auth", "realm": "dev1", "nonce": "abc", "algorithm": "SHA-256"}
    header = digest_header("secret", chal, 1, "c0ffee")
    sha = lambda s: hashlib.sha256(s.encode()).hexdigest()  # noqa: E731
    expected = sha(f"{sha('admin:dev1:secret')}:abc:00000001:c0ffee:auth:{sha('POST:/rpc')}")
    assert f'response="{expected}"' in header and "nc=00000001" in header


def test_digest_rejects_other_algorithms():
    with pytest.raises(ShellyError):
        digest_header("p", {"realm": "r", "nonce": "n", "algorithm": "MD5"}, 1, "c")
    with pytest.raises(ShellyError):
        challenge("Basic realm=x")


def test_chunks():
    assert chunks("abcde", 2) == ["ab", "cd", "e"]
    assert "".join(chunks(watchdog_code())) == watchdog_code()


def test_fallback_windows_from_schedules():
    a = parse_week("00:00/16 06:30/20 08:30/16 17:00/20 22:30/16")
    b = parse_week("00:00/16 07:00/21 09:00/16")
    assert fallback_heating_windows([a, b], 0) == [[330, 540], [960, 1350]]


def test_fallback_windows_heat_all_day_for_a_flat_warm_day():
    # A room held at one warm setpoint all day has no "above its own minimum" period,
    # but it still wants heat: the fallback heats all day rather than never.
    flat = parse_week("00:00/19")
    assert fallback_heating_windows([flat], 0) == [[0, 1440]]


def test_a_flat_day_is_warm_only_at_a_warm_use_level():
    flat14 = parse_week("00:00/14")
    # An unused room held at its unused temperature wants no heat of its own.
    assert fallback_heating_windows([flat14], 0, levels=[UseLevel.UNUSED]) == (
        DEFAULT_HEATING_WINDOWS
    )
    # No use level known: warm only above the unused temperature and the damp floor.
    assert fallback_heating_windows([flat14], 0) == DEFAULT_HEATING_WINDOWS
    assert fallback_heating_windows([flat14], 0, unused_c=13.0) == [[0, 1440]]
    # In use or occasional all day: heat all day.
    for level in (UseLevel.IN_USE, UseLevel.OCCASIONAL):
        assert fallback_heating_windows([flat14], 0, levels=[level]) == [[0, 1440]]


def test_every_room_flat_in_use_still_heats_all_day():
    flat = parse_week("00:00/19")
    levels = [UseLevel.IN_USE] * 3
    assert fallback_heating_windows([flat] * 3, 0, levels=levels) == [[0, 1440]]


def test_unused_rooms_flat_at_14_do_not_hold_the_relay_on_all_day():
    data = yaml.safe_load(HOUSEHOLD.read_text())
    site = parse_site(data, env={"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"})
    for rid in ("bedroom_2", "lounge", "toilet"):
        day = site.fallback_schedule_for(rid).days[2]
        assert len(day.transitions) == 1 and day.transitions[0][1] == 14.0, rid
    drv = LiveDriver(site, _publish)
    for weekday in range(5):
        windows = drv.fallback_windows(weekday)
        assert windows != [[0, 1440]], weekday
        assert sum(b - a for a, b in windows) < 18 * 60, (weekday, windows)


async def _publish(topic, payload):
    return True


def test_fallback_windows_are_never_empty():
    # Every room flat at frost (or no rooms): the watchdog's built-in windows, never an
    # empty list, which the watchdog would take as "never heat".
    frost = parse_week("00:00/7")
    assert fallback_heating_windows([frost], 0) == DEFAULT_HEATING_WINDOWS
    assert fallback_heating_windows([], 0) == DEFAULT_HEATING_WINDOWS


def test_default_windows_match_the_watchdog_script():
    assert "let HEATING = [[330, 510], [960, 1350]];" in watchdog_code()
    assert DEFAULT_HEATING_WINDOWS == [[330, 510], [960, 1350]]


def test_fallback_windows_capped_at_four():
    weeks = [
        parse_week(f"00:00/16 {a:02d}:00/20 {a + 1:02d}:00/16 {b:02d}:00/20 {b + 1:02d}:00/16")
        for a, b in ((2, 6), (10, 14), (18, 22))
    ]
    w = fallback_heating_windows(weeks, 0, lead_min=0)
    assert len(w) == 4
    # Every original span is still covered.
    for start in (120, 360, 600, 840, 1080, 1320):
        assert any(a <= start and start + 60 <= b for a, b in w), start
    assert len(kvs_windows(w)) <= 253


# --- RPC and relay ---------------------------------------------------------------------


async def test_rpc_digest_auth(shelly):
    rpc = ShellyRpc(shelly.host, "pw", shelly.session)
    assert (await rpc.call("Switch.GetStatus", {"id": 0}))["output"] is False
    # Nonce reused with an incrementing nc, no second challenge.
    await rpc.call("Switch.GetStatus", {"id": 1})
    assert shelly.seen_nc == {"00000001", "00000002"}


async def test_rpc_wrong_or_missing_password(shelly):
    with pytest.raises(ShellyError, match="rejected"):
        await ShellyRpc(shelly.host, "nope", shelly.session).call("Switch.GetStatus", {"id": 0})
    with pytest.raises(ShellyError, match="requires a password"):
        await ShellyRpc(shelly.host, None, shelly.session).call("Switch.GetStatus", {"id": 0})


async def test_rpc_error_result(shelly):
    with pytest.raises(ShellyError, match="KVS.Get"):
        await ShellyRpc(shelly.host, "pw", shelly.session).call("KVS.Get", {"key": "none"})


async def test_command_rearms_auto_off_and_heartbeat(shelly):
    b = boiler(shelly)
    await b.refresh()
    await b.command(heating=True, store=False, unix_now=1_700_000_000)
    assert shelly.switches[0] == {"output": True, "apower": 0.0, "timer_duration": 7200}
    assert shelly.kvs[HEARTBEAT_KEY] == 1_700_000_000
    await b.command(heating=False, store=True, unix_now=1_700_000_060)
    assert shelly.switches[0]["output"] is False and "timer_duration" not in shelly.switches[0]
    assert shelly.switches[1]["output"] is True
    await b.refresh()
    assert b.heating.output is False and b.store.output is True and b.reachable


async def test_dry_run_writes_nothing(shelly):
    b = boiler(shelly, dry_run=True)
    await b.refresh()
    await b.command(heating=True, store=True, unix_now=1)
    await b.push_fallback([[330, 510]], [[360, 450]])
    assert not shelly.kvs and shelly.switches[0]["output"] is False
    assert [m for m, _ in shelly.calls] == ["Switch.GetStatus", "Switch.GetStatus"]
    assert [m for m, _ in b.intended] == [
        "Switch.Set",
        "Switch.Set",
        "KVS.Set",
        "KVS.Set",
        "KVS.Set",
    ]


async def test_unreachable_shelly_is_reported():
    async with aiohttp.ClientSession() as session:
        cfg = ShellyConfig(host="127.0.0.1:9")
        b = ShellyBoiler(cfg, ShellyRpc(cfg.host, None, session, timeout_s=0.5), dry_run=False)
        await b.refresh()
        assert not b.reachable and b.errors == 1
        await b.command(True, False, 1)  # must not raise
        assert b.errors == 2


async def test_push_fallback_only_on_change(shelly):
    b = boiler(shelly)
    await b.push_fallback([[330, 510]], ((360, 450),))
    assert shelly.kvs == {"radiate_heat": "[[330,510]]", "radiate_store": "[[360,450]]"}
    n = len(shelly.calls)
    await b.push_fallback([[330, 510]], ((360, 450),))
    assert len(shelly.calls) == n


async def test_install_and_verify_watchdog(shelly):
    b = boiler(shelly)
    code = watchdog_code()
    assert not (await b.watchdog_status(code)).installed
    status = await b.install_watchdog(code)
    assert status.ok and len(code) > 1024  # uploaded in several chunks
    puts = [p for m, p in shelly.calls if m == "Script.PutCode"]
    assert len(puts) == len(chunks(code)) and puts[0]["append"] is False
    # Idempotent: nothing re-uploaded when already current.
    shelly.calls.clear()
    assert (await b.install_watchdog(code)).ok
    assert not any(m == "Script.PutCode" for m, _ in shelly.calls)
    # A changed script is stopped, replaced and restarted.
    status = await b.install_watchdog(code + "\n// v2\n")
    assert status.ok and ("Script.Stop", {"id": status.script_id}) in shelly.calls


# --- burner firing from the relay's power reading --------------------------------------


def test_burner_meter_threshold_hysteresis_and_proof():
    m = BurnerMeter(threshold_w=100.0, hysteresis_w=20.0)
    on = lambda w: SwitchStatus(output=True, apower=w)  # noqa: E731
    # Relay on, pump only: nothing yet shows the burner's load passes through the relay.
    assert m.update(on(7.0)) is None and m.update(on(60.0)) is None
    assert m.update(on(232.0)) is True  # ignition
    assert m.update(on(186.0)) is True
    assert m.update(on(90.0)) is True  # inside the hysteresis band: still firing
    assert m.update(on(57.0)) is False  # pump only: the boiler's thermostat holds it off
    assert m.update(on(95.0)) is False
    assert m.update(SwitchStatus(output=False, apower=0.0)) is False
    assert m.update(SwitchStatus(output=True, apower=None)) is None  # no metering
    assert m.update(None) is None


def test_store_channel_burner():
    m = BurnerMeter(threshold_w=100.0, hysteresis_w=20.0)
    assert m.update(SwitchStatus(output=True, apower=126.3)) is True
    assert m.update(SwitchStatus(output=True, apower=0.0)) is False  # store satisfied


async def test_refresh_reads_the_burner_on_each_channel(shelly):
    b = boiler(shelly)
    shelly.switches[0] = {"output": True, "apower": 186.0}
    shelly.switches[1] = {"output": True, "apower": 125.0}
    await b.refresh()
    assert b.heating_burner is True and b.store_burner is True
    shelly.switches[0] = {"output": True, "apower": 55.0}
    shelly.switches[1] = {"output": True, "apower": 0.0}
    await b.refresh()
    assert b.heating_burner is False and b.store_burner is False
    t = b.telemetry()
    assert t["heating_burner"] is False and t["store_burner"] is False
    assert t["store_power_w"] == 0.0


async def test_burner_metering_can_be_turned_off(shelly):
    cfg = ShellyConfig(host=shelly.host, password="pw", burner_metering=False)
    b = ShellyBoiler(cfg, ShellyRpc(shelly.host, "pw", shelly.session))
    shelly.switches[0] = {"output": True, "apower": 186.0}
    await b.refresh()
    assert b.heating_burner is None and b.store_burner is None


async def test_unreachable_shelly_has_no_burner_reading():
    async with aiohttp.ClientSession() as session:
        cfg = ShellyConfig(host="127.0.0.1:9")
        b = ShellyBoiler(cfg, ShellyRpc(cfg.host, None, session, timeout_s=0.5))
        b.heating_burner = True
        await b.refresh()
        assert not b.reachable and b.heating_burner is None and b.store_burner is None
