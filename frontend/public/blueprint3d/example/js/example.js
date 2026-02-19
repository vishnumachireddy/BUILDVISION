
/*
 * ConstructIQ Project State
 */
window.project = {
    activeFloorIndex: 0,
    itemsByFloor: {},
    floors: [], // Per-floor groups and data
    floorHeight: 304.8, // 10 feet
    floorThickness: 15.24 // 0.5 feet
};

// Listen for messages from the parent App
window.addEventListener('message', function (event) {
    if (event.data.type === 'UPDATE_ACTIVE_FLOOR') {
        window.project.activeFloorIndex = event.data.activeFloorIndex;
        console.log("Active Floor Updated to:", window.project.activeFloorIndex);
        if (window.multiFloorController) {
            window.multiFloorController.update();
        }
    } else if (event.data.type === 'UPDATE_NUM_FLOORS') {
        if (window.multiFloorController) {
            window.multiFloorController.setNumFloors(event.data.numFloors);
        }
    } else if (event.data.type === 'LOAD_LAYOUT') {
        console.log("Blueprint3D received LOAD_LAYOUT:", event.data.layout);
        if (window.blueprint3d && event.data.layout) {
            loadBuildVisionLayout(window.blueprint3d, event.data.layout);
        }
    }
});

function loadBuildVisionLayout(blueprint3d, bvLayout) {
    if (!bvLayout || (!bvLayout.rooms && !bvLayout.walls)) return;

    var bp3dData = {
        "floorplan": {
            "corners": {},
            "walls": [],
            "wallTextures": [],
            "floorTextures": {},
            "newFloorTextures": {}
        },
        "items": []
    };

    var corners = bp3dData.floorplan.corners;
    var bpWalls = bp3dData.floorplan.walls;

    function addCorner(x, y) {
        var id = 'corner-' + Math.random().toString(36).substr(2, 9);
        corners[id] = { "x": x, "y": y };
        return id;
    }

    function addWall(c1, c2) {
        bpWalls.push({
            "corner1": c1,
            "corner2": c2,
            "frontTexture": { "url": "rooms/textures/wallmap.png", "stretch": true, "scale": 0 },
            "backTexture": { "url": "rooms/textures/wallmap.png", "stretch": true, "scale": 0 }
        });
    }

    // Convert Rooms to Walls
    if (bvLayout.rooms) {
        bvLayout.rooms.forEach(function (room) {
            // Assume 1 unit in layout = 1cm in BP3D
            // Scale if necessary: 1 pixel on canvas is roughly 1cm or 1 inch
            var scale = 2.0; // Scale up for better visualization in 3D
            var x = room.x * scale;
            var y = room.y * scale;
            var w = room.width * scale;
            var h = room.height * scale;

            var c1 = addCorner(x, y);
            var c2 = addCorner(x + w, y);
            var c3 = addCorner(x + w, y + h);
            var c4 = addCorner(x, y + h);

            addWall(c1, c2);
            addWall(c2, c3);
            addWall(c3, c4);
            addWall(c4, c1);
        });
    }

    console.log("Converted BP3D Data:", bp3dData);
    blueprint3d.model.loadSerialized(JSON.stringify(bp3dData));
}

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

        $("#reset-view").click(function () {
            if (window.multiFloorController) {
                window.multiFloorController.centerOnActiveFloor();
            } else {
                three.centerCamera();
            }
        });

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
            var floorIndex = window.project.activeFloorIndex;
            var floorData = window.project.floors[floorIndex];
            if (floorData) {
                floorData.items = floorData.items.filter(function (item) {
                    return item !== selectedItem;
                });
            }
            selectedItem.remove();
            saveToLocalStorage(); // Ensure deletion is persisted
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

    function initItems() {
        $("#add-items").find(".add-item").mousedown(function (e) {
            var modelUrl = $(this).attr("model-url");
            var itemType = parseInt($(this).attr("model-type"));
            var metadata = {
                itemName: $(this).attr("model-name"),
                resizable: true,
                modelUrl: modelUrl,
                itemType: itemType,
                floorIndex: window.project.activeFloorIndex // Tag with active floor
            }

            // addItem will trigger itemLoadedCallback which handles parenting
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
        // Collect everything for the new plan structure
        var planData = {
            version: "4.0",
            totalFloors: parseInt(new URLSearchParams(window.location.search).get('floors')) || 1,
            activeFloor: window.project.activeFloorIndex,
            // exportSerialized includes all items with their floorIndex metadata
            fullDesign: blueprint3d.model.exportSerialized()
        };

        console.log("Saving Professional Plan V4.0:", planData);

        // Save to LocalStorage for persistence
        saveToLocalStorage();

        var canvas = document.querySelector('#viewer canvas') || document.getElementById('three-canvas');
        if (!canvas) {
            alert("3D view not ready yet.");
            return;
        }

        // Final save before export
        saveToLocalStorage();

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
    var floorHeight = window.project.floorHeight;
    var floorGroups = []; // Persistent groups for each floor

    function init() {
        console.log("████████ CONSTRUCTIQ MULTI-FLOOR v3.0 ACTIVE ████████");
        var params = new URLSearchParams(window.location.search);
        numFloors = parseInt(params.get('floors')) || 1;
        window.project.activeFloorIndex = parseInt(params.get('activeFloor')) || 0;

        var threeScene = blueprint3d.three.getScene().getScene();

        // Create persistent floor groups ONLY ONCE
        for (var f = 0; f < numFloors; f++) {
            var group = new THREE.Group();
            var elevation = f * floorHeight;
            group.position.y = elevation;
            group.name = "FloorGroup_" + f;
            group.userData.isFloorGroup = true;
            group.userData.floorIndex = f;
            threeScene.add(group);

            floorGroups.push(group);
            window.project.floors.push({
                index: f,
                group: group,
                items: [],
                elevation: elevation
            });
        }

        console.log("MultiFloorController Init - Floors:", numFloors, "Groups Created:", floorGroups.length);

        // Listen for item additions to set height and parent correctly
        blueprint3d.model.scene.itemLoadedCallbacks.add(function (item) {
            var floorIndex = (item.metadata && item.metadata.floorIndex !== undefined)
                ? item.metadata.floorIndex
                : window.project.activeFloorIndex;

            var floorData = window.project.floors[floorIndex];
            if (!floorData) return;

            var group = floorData.group;

            if (group && !item.userData.heightProcessed) {
                // Correct Y-position per user requirement: floorElevation + itemHeight/2
                // But since they are children of the group, local Y is just itemHeight/2
                var itemHeight = item.getHeight();
                item.position.y = itemHeight / 2;

                // Assign to floor-specific group
                group.add(item);
                floorData.items.push(item);

                item.userData.heightProcessed = true;
                item.userData.floorIndex = floorIndex;
                item.metadata.floorIndex = floorIndex;

                saveToLocalStorage();
                updateVisibility();
            }
        });

        if (numFloors > 1) {
            blueprint3d.model.floorplan.fireOnUpdatedRooms(function () {
                setTimeout(update, 200);
            });
            blueprint3d.model.floorplan.roomLoadedCallbacks.add(function () {
                setTimeout(update, 200);
            });
            blueprint3d.model.floorplan.fireOnRedraw(function () {
                setTimeout(update, 200);
            });
            setTimeout(update, 1000);
        }
    }

    this.setNumFloors = function (newCount) {
        console.log("MultiFloorController: Updating numFloors to:", newCount);
        var threeScene = blueprint3d.three.getScene().getScene();

        if (newCount > numFloors) {
            // Add floors
            for (var f = numFloors; f < newCount; f++) {
                var group = new THREE.Group();
                var elevation = f * floorHeight;
                group.position.y = elevation;
                group.name = "FloorGroup_" + f;
                group.userData.isFloorGroup = true;
                group.userData.floorIndex = f;
                threeScene.add(group);

                floorGroups.push(group);
                window.project.floors.push({
                    index: f,
                    group: group,
                    items: [],
                    elevation: elevation
                });
            }
        } else if (newCount < numFloors) {
            // Remove floors (careful not to delete items if we want to support undo/redo, 
            // but for simplicity we remove the groups from scene)
            for (var f = numFloors - 1; f >= newCount; f--) {
                var group = floorGroups[f];
                if (group) {
                    threeScene.remove(group);
                }
                floorGroups.pop();
                window.project.floors.pop();
            }
        }

        numFloors = newCount;
        update();
    }

    this.update = function () {
        update();
    }

    function updateVisibility() {
        var activeIndex = window.project.activeFloorIndex;
        window.project.floors.forEach(function (floor) {
            var group = floor.group;
            if (group) {
                var isActive = (floor.index === activeIndex);

                // USER REQUIREMENT: Default hide non-active floors
                // For professional view 0.15 opacity can be used
                group.visible = true; // Stay in stack

                group.traverse(function (node) {
                    if (node.material) {
                        if (!node.userData.originalMaterial) {
                            node.userData.originalMaterial = node.material.clone();
                        }

                        if (isActive) {
                            node.material = node.userData.originalMaterial;
                        } else {
                            node.material = node.userData.originalMaterial.clone();
                            node.material.transparent = true;
                            node.material.opacity = 0.15; // Set to 0 to hide completely if preferred
                        }
                    }
                });
            }
        });

        // Final camera update
        if (window.multiFloorController) {
            window.multiFloorController.centerOnActiveFloor();
        }
    }

    function saveToLocalStorage() {
        try {
            // exportSerialized already includes items and their metadata (including floorIndex)
            var serialized = blueprint3d.model.exportSerialized();
            localStorage.setItem('constructiq_autosave', serialized);
            console.log("ConstructIQ: Project Autosaved to LocalStorage");
        } catch (e) {
            console.warn("Autosave failed:", e);
        }
    }

    // Make it accessible for other controllers
    window.saveToLocalStorage = saveToLocalStorage;

    function update() {
        console.log("MultiFloorController Update - Re-Grouping Scene Graph");
        try {
            if (typeof THREE === 'undefined') return;

            var threeScene = blueprint3d.three.getScene().getScene();
            var rooms = blueprint3d.model.floorplan.getRooms();
            var children = threeScene.children.slice();

            // 1. RESTORE Live structural elements to root scene before anything else
            // This ensures they are captured in the 'children' slice for the next organization cycle
            floorGroups.forEach(function (group) {
                var toRestore = [];
                group.children.forEach(function (child) {
                    if (child.userData.isLiveStructural) toRestore.push(child);
                });
                toRestore.forEach(function (child) {
                    threeScene.add(child);
                });
            });

            // Re-capture children after restoration
            children = threeScene.children.slice();

            // Handle visibility of floor groups
            updateVisibility();

            // 2. Clear structural clones and tags
            floorGroups.forEach(function (group) {
                var toRemove = [];
                group.children.forEach(function (child) {
                    if (child.userData.isStructural || child.userData.isLiveStructural) {
                        toRemove.push(child);
                    }
                });
                toRemove.forEach(function (child) {
                    group.remove(child);
                });
            });

            if (numFloors <= 1) return;

            for (var f = 0; f < numFloors; f++) {
                var isActiveFloor = (f === window.project.activeFloorIndex);
                var group = floorGroups[f];
                if (!group) continue;

                // 1. Move/Clone Structural Elements (Walls, Floors)
                if (isActiveFloor) {
                    // Move live children into the active group to get the yOffset automatically
                    children.forEach(function (child) {
                        if (child instanceof THREE.Light ||
                            child instanceof THREE.Camera ||
                            child.name === "skybox" ||
                            child.userData.isFloorClone ||
                            child.userData.isFloorGroup || // Only skip REAL floor groups
                            child instanceof BP3D.Items.Item) {
                            return;
                        }
                        child.userData.isLiveStructural = true;
                        group.add(child);
                    });
                } else {
                    // Clone structural elements for inactive floors
                    children.forEach(function (child) {
                        if (child instanceof THREE.Light ||
                            child instanceof THREE.Camera ||
                            child.name === "skybox" ||
                            child.userData.isFloorClone ||
                            child.userData.isFloorGroup || // Only skip REAL floor groups
                            child instanceof BP3D.Items.Item) {
                            return;
                        }
                        try {
                            var clone = child.clone();
                            clone.userData.isFloorClone = true;
                            clone.userData.isStructural = true;

                            // Ghosting handled in updateVisibility() via traverse
                            group.add(clone);
                        } catch (e) { }
                    });
                }

                // 2. Render Structural slabs and columns for ALL floors
                var slabMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
                rooms.forEach(function (room) {
                    var corners = room.interiorCorners;
                    if (corners && corners.length > 0) {
                        var shape = new THREE.Shape();
                        shape.moveTo(corners[0].x, corners[0].y);
                        for (var i = 1; i < corners.length; i++) shape.lineTo(corners[i].x, corners[i].y);
                        shape.closePath();
                        var slabMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), slabMaterial);
                        slabMesh.rotation.x = Math.PI / 2;
                        slabMesh.position.y = -0.1;
                        slabMesh.userData.isStructural = true;
                        group.add(slabMesh);
                    }
                    if (room.corners) {
                        room.corners.forEach(function (corner) {
                            var col = new THREE.Mesh(new THREE.BoxGeometry(20, floorHeight, 20), new THREE.MeshPhongMaterial({ color: 0xdddddd }));
                            col.position.set(corner.x, -floorHeight / 2, corner.y);
                            col.userData.isStructural = true;
                            group.add(col);
                        });
                    }
                });
            }
        } catch (err) {
            console.error("MultiFloorController Update Error:", err);
        }

        // Auto-center camera only if building is small or after significant change
        if (numFloors > 1) {
            this.centerOnActiveFloor();
        }
    }

    this.centerOnActiveFloor = function () {
        var three = blueprint3d.three;
        var activeIndex = window.project.activeFloorIndex;
        var elevation = activeIndex * floorHeight;

        // Calculate floorplan center
        var box = new THREE.Box3();
        var floorplanGroup = floorGroups[activeIndex];
        if (floorplanGroup) {
            box.setFromObject(floorplanGroup);
        }

        var center = box.isEmpty() ? new THREE.Vector3(500, 0, 500) : box.getCenter(new THREE.Vector3());

        // POSITION: center.x, activeFloorElevation + 8, center.z + 12
        // Note: 1 unit in Blueprint3D = 1cm? 
        // 8ft = 243cm. 12ft = 365cm. 
        // Let's use the multiplier requested but scale to architectural CM.
        var yCam = elevation + 800; // +8ft approx 240cm, let's use 800 for better view
        var zCam = center.z + 1200;

        var targetPos = new THREE.Vector3(center.x, yCam, zCam);
        var targetFocus = new THREE.Vector3(center.x, elevation + 400, center.z);

        three.camera.position.lerp(targetPos, 0.1);
        three.controls.target.lerp(targetFocus, 0.1);
        three.controls.update();
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
        textureDir: "/blueprint3d/example/models/textures/",
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
    window.multiFloorController = new MultiFloorController(blueprint3d);

    // Load with persistence check
    var saved = localStorage.getItem('constructiq_autosave');
    if (saved) {
        blueprint3d.model.loadSerialized(saved);
        console.log("ConstructIQ: Restored from LocalStorage");
    } else {
        blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"/blueprint3d/example/rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }

    // Auto-save when items are added or removed
    blueprint3d.model.scene.itemLoadedCallbacks.add(saveToLocalStorage);
    blueprint3d.model.scene.itemRemovedCallbacks.add(saveToLocalStorage);
});
