require([
    'game/data/data',
    'game/entities',
    'game/huditems'
], function(data, entities, huditems) {
    var $game, game, hud, rszTimeout,
        firstZone = true;

    window.lttp = {};

    $(function() {
        //$(window).on('resize', onWindowResize);

        $game = $('#game');

        lttp.game = game = new gf.Game('game', {
            gravity: 0,
            friction: [0, 0],
            width: $game.width(),
            height: $game.height()
        });

        game.loader.on('progress', function(e) {
        });

        game.loader.on('complete', function() {
            game.spritepool.add('enemy', entities.Enemy);
            game.spritepool.add('link', entities.Link);

            //initialize world and track link with camera
            game.loadWorld('world_lightworld');

            lttp.layers = {};

            lttp.layers.zones = game.world.findLayer('zones');
            lttp.layers.player = game.world.findLayer('player');

            lttp.layers.zones.spawn();
            lttp.layers.player.spawn();

            game.camera.follow(lttp.link = lttp.layers.player.children[0]);

            //bind some game related keys
            game.input.keyboard.on(gf.input.KEY.I, onToggleInventory);
            game.input.keyboard.on(gf.input.KEY.M, onToggleMap);
            game.input.keyboard.on(gf.input.KEY.P, onToggleAudio);

            //initialize HUD objects
            game.addChild(initHud());

            //start render loop
            game.render();
        });

        game.loader.load(data.resources);
    });

    function initHud() {
        var mp = {};
        'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function(c) {
            mp[c] = '_' + c;
        });
        mp[':'] = 'colon';
        mp[','] = 'comma';
        mp['-'] = 'dash';
        mp['!'] = 'exclamation';
        mp['.'] = 'period';
        mp['?'] = 'question';
        mp[';'] = 'semicolon';

        var retofganon = new gf.TextureFont('font_retofganon', { ext: '.png', map: mp }),
            hudfnt = new gf.TextureFont('font_hud', { ext: '.png' });

        lttp.gui = gui = new gf.Gui();
        gui.scale.x = gui.scale.y = 1.5;
        gui.items = {};

        //Add magic meter
        gui.addChild(gui.items.magicMeter = new huditems.MagicMeter([40, 36], { value: 1 }));

        //Add equipted item
        gui.addChild(gui.items.equipted = new huditems.EquiptedItem([75, 42], { value: '' }));

        //Add inventory counters
        gui.addChild(gui.items.rupees = new huditems.InventoryCounter([135, 30], { value: 0, name: 'rupees', font: hudfnt.clone() }));
        gui.addChild(gui.items.bombs = new huditems.InventoryCounter([195, 30], { value: 0, name: 'bombs', font: hudfnt.clone() }));
        gui.addChild(gui.items.arrows = new huditems.InventoryCounter([245, 30], { value: 0, name: 'arrows', font: hudfnt.clone() }));

        //Add life hearts
        gui.addChild(gui.items.life = new huditems.LifeMeter([320, 35], { value: 3, font: retofganon.clone() }));

        return gui;
    }

    function onToggleInventory() {}

    function onToggleMap() {}

    function onToggleAudio() {
        gf.audio.pauseAll();
    }

    function doResize()
    {
        var w = $(window).width(),
            h = $(window).height();

        if(hud) {
            hud.items.life.position.x = game.camera.size.x - (175); //160 is 10 hearts + 15 pad
            hud.items.life.position.y = 15;
        }

        game.resize(w, h);
    }

    function onWindowResize() {
        clearTimeout(rszTimeout);
        rszTimeout = setTimeout(doResize, 250);
    }

    lttp.loadZone = function(zone, vec) {
        if(lttp.activeLayer) {
            lttp.activeLayer.despawn();
        }

        console.log('load zone:', zone.name, '('+vec.x+','+vec.y+')');

        //transfer the zone stuff
        lttp.activeZone = zone;
        lttp.activeLayer = lttp.layers[zone.name] || game.world.findLayer(zone.name);
        lttp.activeLayer.spawn();

        game.camera.unfollow();
        game.camera.unconstrain();
        if(!firstZone) {
            var p = vec.x ? 'x' : 'y',
                last = 0;

            $({v:0}).animate({v:game.camera.size[p] + 10}, {
                duration: 500,
                easing: 'swing',
                step: function(now, tween) {
                    var n = now - last;

                    game.camera.pan(
                        n * vec.x,
                        n * vec.y
                    );

                    last = now;
                },
                done: loadZoneDone
            });
        } else {
            loadZoneDone();
        }
    }

    function loadZoneDone() {
        var zone = lttp.activeZone;

        firstZone = false;

        //set camera bounds
        if(!zone.bounds) {
            zone.bounds = zone.hitArea.clone();

            //all except polygon
            if(zone.bounds.x !== undefined) {
                zone.bounds.x += zone.position.x;
                zone.bounds.y += zone.position.y;
            }
            //polygon
            else {
                for(var i = 0; i < zone.bounds.points.length; ++i) {
                    var p = zone.bounds.points[i];

                    p.x += zone.position.x;
                    p.y += zone.position.y;
                }
            }
        }
        game.camera.constrain(zone.bounds.clone());
        game.camera.follow(lttp.link);
    }
});