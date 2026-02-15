
/*
 * Camera Buttons
 */

var CameraButtons = function (blueprint3d) {

    var orbitControls = blueprint3d.three.controls;
    var three = blueprint3d.three;

    var panSpeed = 30;
    var directions = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    }

    function init() {
        // Camera controls
        $("#zoom-in").click(zoomIn);
        $("#zoom-out").click(zoomOut);
        $("#zoom-in").dblclick(preventDefault);
        $("#zoom-out").dblclick(preventDefault);

        $("#reset-view").click(three.centerCamera)

        $("#move-left").click(function () {
            pan(directions.LEFT)
        })
        $("#move-right").click(function () {
            pan(directions.RIGHT)
        })
        $("#move-up").click(function () {
            pan(directions.UP)
        })
        $("#move-down").click(function () {
            pan(directions.DOWN)
        })

        $("#move-left").dblclick(preventDefault);
        $("#move-right").dblclick(preventDefault);
        $("#move-up").dblclick(preventDefault);
        $("#move-down").dblclick(preventDefault);
    }

    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function pan(direction) {
        switch (direction) {
            case directions.UP:
                orbitControls.panXY(0, panSpeed);
                break;
            case directions.DOWN:
                orbitControls.panXY(0, -panSpeed);
                break;
            case directions.LEFT:
                orbitControls.panXY(panSpeed, 0);
                break;
            case directions.RIGHT:
                orbitControls.panXY(-panSpeed, 0);
                break;
        }
    }

    function zoomIn(e) {
        e.preventDefault();
        orbitControls.dollyIn(1.1);
        orbitControls.update();
    }

    function zoomOut(e) {
        e.preventDefault;
        orbitControls.dollyOut(1.1);
        orbitControls.update();
    }

    init();
}

/*
 * Context menu for selected item
 */

var ContextMenu = function (blueprint3d) {

    var scope = this;
    var selectedItem;
    var three = blueprint3d.three;

    function init() {
        $("#context-menu-delete").click(function (event) {
            selectedItem.remove();
        });

        three.itemSelectedCallbacks.add(itemSelected);
        three.itemUnselectedCallbacks.add(itemUnselected);

        initResize();

        $("#fixed").click(function () {
            var checked = $(this).prop('checked');
            selectedItem.setFixed(checked);
        });
    }

    function cmToIn(cm) {
        return cm / 2.54;
    }

    function inToCm(inches) {
        return inches * 2.54;
    }

    function itemSelected(item) {
        selectedItem = item;

        $("#context-menu-name").text(item.metadata.itemName);

        $("#item-width").val(cmToIn(selectedItem.getWidth()).toFixed(0));
        $("#item-height").val(cmToIn(selectedItem.getHeight()).toFixed(0));
        $("#item-depth").val(cmToIn(selectedItem.getDepth()).toFixed(0));

        $("#context-menu").show();

        $("#fixed").prop('checked', item.fixed);
    }

    function resize() {
        selectedItem.resize(
            inToCm($("#item-height").val()),
            inToCm($("#item-width").val()),
            inToCm($("#item-depth").val())
        );
    }

    function initResize() {
        $("#item-height").change(resize);
        $("#item-width").change(resize);
        $("#item-depth").change(resize);
    }

    function itemUnselected() {
        selectedItem = null;
        $("#context-menu").hide();
    }

    init();
}

/*
 * Loading modal for items
 */

var ModalEffects = function (blueprint3d) {

    var scope = this;
    var blueprint3d = blueprint3d;
    var itemsLoading = 0;

    this.setActiveItem = function (active) {
        itemSelected = active;
        update();
    }

    function update() {
        if (itemsLoading > 0) {
            $("#loading-modal").show();
        } else {
            $("#loading-modal").hide();
        }
    }

    function init() {
        blueprint3d.model.scene.itemLoadingCallbacks.add(function () {
            itemsLoading += 1;
            update();
        });

        blueprint3d.model.scene.itemLoadedCallbacks.add(function () {
            itemsLoading -= 1;
            update();
        });

        update();
    }

    init();
}

/*
 * Side menu
 */

var SideMenu = function (blueprint3d, floorplanControls, modalEffects) {
    var blueprint3d = blueprint3d;
    var floorplanControls = floorplanControls;
    var modalEffects = modalEffects;

    var ACTIVE_CLASS = "active";

    var tabs = {
        "FLOORPLAN": $("#floorplan_tab"),
        "SHOP": $("#items_tab"),
        "DESIGN": $("#design_tab")
    }

    var scope = this;
    this.stateChangeCallbacks = $.Callbacks();

    this.states = {
        "DEFAULT": {
            "div": $("#viewer"),
            "tab": tabs.DESIGN
        },
        "FLOORPLAN": {
            "div": $("#floorplanner"),
            "tab": tabs.FLOORPLAN
        },
        "SHOP": {
            "div": $("#add-items"),
            "tab": tabs.SHOP
        }
    }

    // sidebar state
    var currentState = scope.states.FLOORPLAN;

    function init() {
        for (var tab in tabs) {
            var elem = tabs[tab];
            elem.click(tabClicked(elem));
        }

        $("#update-floorplan").click(floorplanUpdate);

        initLeftMenu();

        blueprint3d.three.updateWindowSize();
        handleWindowResize();

        initItems();

        setCurrentState(scope.states.DEFAULT);
    }

    function floorplanUpdate() {
        setCurrentState(scope.states.DEFAULT);
    }

    function tabClicked(tab) {
        return function () {
            // Stop three from spinning
            blueprint3d.three.stopSpin();

            // Selected a new tab
            for (var key in scope.states) {
                var state = scope.states[key];
                if (state.tab == tab) {
                    setCurrentState(state);
                    break;
                }
            }
        }
    }

    function setCurrentState(newState) {

        if (currentState == newState) {
            return;
        }

        // show the right tab as active
        if (currentState.tab !== newState.tab) {
            if (currentState.tab != null) {
                currentState.tab.removeClass(ACTIVE_CLASS);
            }
            if (newState.tab != null) {
                newState.tab.addClass(ACTIVE_CLASS);
            }
        }

        // set item unselected
        blueprint3d.three.getController().setSelectedObject(null);

        // show and hide the right divs
        currentState.div.hide()
        newState.div.show()

        // custom actions
        if (newState == scope.states.FLOORPLAN) {
            floorplanControls.updateFloorplanView();
            floorplanControls.handleWindowResize();
        }

        if (currentState == scope.states.FLOORPLAN) {
            blueprint3d.model.floorplan.update();
        }

        if (newState == scope.states.DEFAULT) {
            blueprint3d.three.updateWindowSize();
        }

        // set new state
        handleWindowResize();
        currentState = newState;

        scope.stateChangeCallbacks.fire(newState);
    }

    function initLeftMenu() {
        $(window).resize(handleWindowResize);
        handleWindowResize();
    }

    function handleWindowResize() {
        $(".sidebar").height(window.innerHeight);
        $("#add-items").height(window.innerHeight);

    };

    // TODO: this doesn't really belong here
    function initItems() {
        $("#add-items").find(".add-item").mousedown(function (e) {
            var modelUrl = $(this).attr("model-url");
            var itemType = parseInt($(this).attr("model-type"));
            var metadata = {
                itemName: $(this).attr("model-name"),
                resizable: true,
                modelUrl: modelUrl,
                itemType: itemType
            }

            blueprint3d.model.scene.addItem(itemType, modelUrl, metadata);
            setCurrentState(scope.states.DEFAULT);
        });
    }

    init();

}

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

    var scope = this;
    var three = blueprint3d.three;
    var isAdmin = isAdmin;

    var currentTarget = null;

    function initTextureSelectors() {
        $(".texture-select-thumbnail").click(function (e) {
            var textureUrl = $(this).attr("texture-url");
            var textureStretch = ($(this).attr("texture-stretch") == "true");
            var textureScale = parseInt($(this).attr("texture-scale"));
            currentTarget.setTexture(textureUrl, textureStretch, textureScale);

            e.preventDefault();
        });
    }

    function init() {
        three.wallClicked.add(wallClicked);
        three.floorClicked.add(floorClicked);
        three.itemSelectedCallbacks.add(reset);
        three.nothingClicked.add(reset);
        sideMenu.stateChangeCallbacks.add(reset);
        initTextureSelectors();
    }

    function wallClicked(halfEdge) {
        currentTarget = halfEdge;
        $("#floorTexturesDiv").hide();
        $("#wallTextures").show();
    }

    function floorClicked(room) {
        currentTarget = room;
        $("#wallTextures").hide();
        $("#floorTexturesDiv").show();
    }

    function reset() {
        $("#wallTextures").hide();
        $("#floorTexturesDiv").hide();
    }

    init();
}

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function (blueprint3d) {

    var canvasWrapper = '#floorplanner';

    // buttons
    var move = '#move';
    var remove = '#delete';
    var draw = '#draw';

    var activeStlye = 'btn-primary disabled';

    this.floorplanner = blueprint3d.floorplanner;

    var scope = this;

    function init() {

        $(window).resize(scope.handleWindowResize);
        scope.handleWindowResize();

        // mode buttons
        scope.floorplanner.modeResetCallbacks.add(function (mode) {
            $(draw).removeClass(activeStlye);
            $(remove).removeClass(activeStlye);
            $(move).removeClass(activeStlye);
            if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
                $(move).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $(draw).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
                $(remove).addClass(activeStlye);
            }

            if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $("#draw-walls-hint").show();
                scope.handleWindowResize();
            } else {
                $("#draw-walls-hint").hide();
            }
        });

        $(move).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
        });

        $(draw).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
        });

        $(remove).click(function () {
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
        });
    }

    this.updateFloorplanView = function () {
        scope.floorplanner.reset();
    }

    this.handleWindowResize = function () {
        $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
        scope.floorplanner.resizeView();
    };

    init();
};

var mainControls = function (blueprint3d) {
    var blueprint3d = blueprint3d;

    function newDesign() {
        blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }



    function saveDesign() {
        var canvas = document.querySelector('#viewer canvas') || document.getElementById('three-canvas');
        if (!canvas) {
            alert("3D view not ready yet.");
            return;
        }
        var imgData = canvas.toDataURL("image/png");
        var a = window.document.createElement('a');
        a.href = imgData;
        a.download = 'blueprint.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function init() {
        $("#new").click(newDesign);
        $("#saveFile").click(saveDesign);
    }

    init();
}

/*
 * Multi-Floor Rendering Controller
 */

var MultiFloorController = function (blueprint3d) {
    var scope = this;
    var numFloors = 1;
    var floorHeight = 250; // cm
    var clones = [];

    function init() {
        console.log("████████ CONSTRUCTIQ MULTI-FLOOR v2.1 ACTIVE ████████");
        var params = new URLSearchParams(window.location.search);
        numFloors = parseInt(params.get('floors')) || 1;
        console.log("MultiFloorController Init - Floors:", numFloors);

        if (numFloors > 1) {
            // Use public API methods for callbacks
            blueprint3d.model.floorplan.fireOnUpdatedRooms(function () {
                console.log("Room updated callback through fireOnUpdatedRooms");
                setTimeout(update, 200);
            });

            blueprint3d.model.floorplan.roomLoadedCallbacks.add(function () {
                console.log("Room loaded callback");
                setTimeout(update, 200);
            });

            blueprint3d.model.floorplan.fireOnRedraw(function () {
                console.log("Floorplan redraw callback");
                setTimeout(update, 200);
            });

            // Initial trigger
            setTimeout(update, 1000);
        }
    }

    function update() {
        console.log("MultiFloorController Update - Stacking", numFloors, "floors");
        try {
            if (typeof THREE === 'undefined') {
                console.error("THREE is not defined! Stacking failed.");
                return;
            }

            var threeScene = blueprint3d.three.getScene().getScene();

            // Remove old clones
            clones.forEach(function (c) {
                threeScene.remove(c);
            });
            clones = [];

            if (numFloors <= 1) return;

            var children = threeScene.children.slice();
            var rooms = blueprint3d.model.floorplan.getRooms();
            console.log("Current rooms count:", rooms.length);

            for (var f = 1; f < numFloors; f++) {
                var yOffset = f * floorHeight;
                var floorGroup = new THREE.Group();
                floorGroup.position.y = yOffset;
                floorGroup.userData.isFloorClone = true;

                // 1. Clone Existing Geometry
                children.forEach(function (child) {
                    if (child instanceof THREE.Light ||
                        child instanceof THREE.Camera ||
                        child.name === "skybox" ||
                        child.userData.isFloorClone) {
                        return;
                    }
                    try {
                        var clone = child.clone();
                        clone.userData.isFloorClone = true;
                        floorGroup.add(clone);
                    } catch (e) {
                        console.warn("Could not clone child:", child, e);
                    }
                });

                // 2. Add Structural Slab (Separation Layer)
                var slabMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide });
                rooms.forEach(function (room) {
                    var corners = room.interiorCorners;
                    if (corners && corners.length > 0) {
                        var shape = new THREE.Shape();
                        shape.moveTo(corners[0].x, corners[0].y);
                        for (var i = 1; i < corners.length; i++) {
                            shape.lineTo(corners[i].x, corners[i].y);
                        }
                        shape.closePath();

                        var slabGeo = new THREE.ShapeGeometry(shape);
                        var slabMesh = new THREE.Mesh(slabGeo, slabMaterial);
                        slabMesh.rotation.x = Math.PI / 2;
                        slabMesh.position.y = -1.0;
                        slabMesh.userData.isFloorClone = true;
                        floorGroup.add(slabMesh);
                    }

                    // 3. Add Corner Columns (Structural)
                    var columnMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
                    if (room.corners) {
                        room.corners.forEach(function (corner) {
                            var columnGeo = new THREE.BoxGeometry(25, floorHeight, 25);
                            var columnMesh = new THREE.Mesh(columnGeo, columnMaterial);
                            columnMesh.position.set(corner.x, -floorHeight / 2, corner.y);
                            columnMesh.userData.isFloorClone = true;
                            floorGroup.add(columnMesh);
                        });
                    }
                });

                clones.push(floorGroup);
                threeScene.add(floorGroup);
            }
            console.log("Update complete. Added", clones.length, "floor clones.");
        } catch (err) {
            console.error("MultiFloorController Update Error:", err);
        }
    }

    init();
}

/*
 * Initialize!
 */

$(document).ready(function () {

    // main setup
    var opts = {
        floorplannerElement: 'floorplanner-canvas',
        threeElement: '#viewer',
        threeCanvasElement: 'three-canvas',
        textureDir: "models/textures/",
        widget: false
    }
    var blueprint3d = new BP3D.Blueprint3d(opts);

    var modalEffects = new ModalEffects(blueprint3d);
    var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    var contextMenu = new ContextMenu(blueprint3d);
    var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
    var textureSelector = new TextureSelector(blueprint3d, sideMenu);
    var cameraButtons = new CameraButtons(blueprint3d);
    mainControls(blueprint3d);
    new MultiFloorController(blueprint3d);

    // This serialization format needs work
    // Load a simple rectangle room
    blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
});
