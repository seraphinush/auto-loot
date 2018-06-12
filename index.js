// Version 1.37 r:08

const Command = require('command')
const Vec3 = require('tera-vec3')
const config = require('./config.json')
const blacklist = require('./blacklist.js')

// credit : https://github.com/Some-AV-Popo
String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

module.exports = function AutoLootOld(d) {
    const command = Command(d)

    let auto = config.auto,
        enable = config.enable,
        loopInterval = config.loopInterval,
        lootDelay = config.lootDelay

    let location = new Vec3(0, 0, 0),
        loop = 0,
        loot = {},
        lootDelayTimeout = 0,
        mounted = false,
        myGameId = 0

    // command
    command.add(['loot', 'ㅣㅐㅐㅅ'], (arg) => {
        // toggle
        if (!arg) {
            enable = !enable
            status()
        }
        // auto
        else if (arg === 'a' || arg === 'auto') {
            auto = !auto
            setup()
        }
        // status
        else if (arg === 's' || arg === 'status') status()
        else send(`Invalid argument.`.clr('FF0000'))
    })

    // code
    d.hook('S_LOGIN', 10, (e) => {
        myGameId = e.gameId
        setup()
    })
    d.hook('S_LOAD_TOPO', 'raw', () => { loot = {}; mounted = false })
    d.hook('C_PLAYER_LOCATION', 3, (e) => { location = e.loc })

    // mount condition
    d.hook('S_MOUNT_VEHICLE', 2, (e) => { if (e.gameId.equals(myGameId)) mounted = true })
    d.hook('S_UNMOUNT_VEHICLE', 2, (e) => { if (e.gameId.equals(myGameId)) mounted = false })

    // collect items in set
    d.hook('S_SPAWN_DROPITEM', 6, (e) => { if (!(blacklist.includes(e.item))) loot[e.gameId] = e })
    
    // remove despawned items in set
    d.hook('S_DESPAWN_DROPITEM', 4, (e) => { if (e.gameId in loot) delete loot[e.gameId] })

    // K TERA : 'That isn't yours.' message
    d.hook('S_SYSTEM_MESSAGE', 1, (e) => { if (e.message === '@41') return false })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    d.hook('C_TRY_LOOT_DROPITEM', 4, () => { lootAll() })

    // helper
    function lootAll() {
        if (!enable || mounted) return
        for (let item in loot) {
            if (location.dist3D(loot[item].loc) < 120) {
                d.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId })
            }
            // rudimentary way to delay looting nearby dropitems
            // could convert async function/await as alternative
            lootDelayTimeout = setTimeout(() => {}, lootDelay)

        }
    }

    function setup() {
        clearInterval(loop)
        loop = 0;
        loop = auto ? setInterval(lootAll, loopInterval) : 0
    }

    function send(msg) { command.message(`[auto-loot-old] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }

    function status() { send(
        `Ranged loot : ${enable ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`,
        `Auto loot : ${auto ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`)
    }

}