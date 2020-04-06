
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

console.log("assign brain3d");
var brain3d = (function() {

    var views = {
        "3d": {
            "pos": new THREE.Vector3(0, 0, -1)
        }/*,
        "left_lateral": {
            "pos": new THREE.Vector3(-1, 0, 0)
        },
        "right_lateral": {
            "pos": new THREE.Vector3(1, 0, 0)
        },
        "dorsal": {
            "pos": new THREE.Vector3(0, 1, 0)
        },
        "ventral": {
            "pos": new THREE.Vector3(0, -1, 0)
        },
        "anterior": {
            "pos": new THREE.Vector3(0, 0, -1)
        },
        "posterior": {
            "pos": new THREE.Vector3(0, 0, 1)
        }*/
    };

    var flash = true;
    var default_opacity_2d = 0.6;
    var default_opacity_3d = 0.5;
    var mni_image = "mixed";

    var default_camera_distance = 250;

    var rotateDirection = [0, 0];
    var zoomDirection = 0;

    var containers = {};
    var cameras = {};
    var cameras_brain_regions = {};
    var scenes = {};
    var scenes_brain_regions = {};
    var renderers = {};
    var lights = {};
    var lights_brain_regions = {};
    var geometries = {};
    var materials = {};
    var brain_grey_meshes = {};
    var brain_white_meshes = {};
    var brain_csf_meshes = {};
    var slice_image_planes = {};

    // Slice region images
    var slice_region_image_planes = {};
    var slice_region_canvases = {
        'combined_x': {
            'lower': document.getElementById('slice_region_canvas_combined_x_lower'),
            'upper': document.getElementById('slice_region_canvas_combined_x_upper')
        },
        'combined_y': {
            'lower': document.getElementById('slice_region_canvas_combined_y_lower'),
            'upper': document.getElementById('slice_region_canvas_combined_y_upper')
        },
        'combined_z': {
            'lower': document.getElementById('slice_region_canvas_combined_z_lower'),
            'upper': document.getElementById('slice_region_canvas_combined_z_upper')
        },
        'single_x': document.getElementById("slice_region_canvas_single_x"),
        'single_y': document.getElementById("slice_region_canvas_single_y"),
        'single_z': document.getElementById("slice_region_canvas_single_z")
    };

    var controls, stats;

    var textureLoader = new THREE.TextureLoader();

    var x_min = talairach.x_min;
    var x_max = talairach.x_max;
    var y_min = talairach.y_min;
    var y_max = talairach.y_max;
    var z_min = talairach.z_min;
    var z_max = talairach.z_max;

    var x_width = x_max - x_min;
    var y_width = y_max - y_min;
    var z_width = z_max - z_min;

    var x_center = (x_max+x_min)/2;
    var y_center = (y_max+y_min)/2;
    var z_center = (z_max+z_min)/2;

    var xClippingPlaneLower = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 100 );
    var xClippingPlaneLower2 = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 100 );
    var xClippingPlaneUpper = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 100 );
    var xClippingPlaneUpper2 = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 100 );
    var yClippingPlaneLower = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 100 );
    var yClippingPlaneLower2 = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 100 );
    var yClippingPlaneUpper = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 100 );
    var yClippingPlaneUpper2 = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 100 );
    var zClippingPlaneLower = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 100 );
    var zClippingPlaneLower2 = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 100 );
    var zClippingPlaneUpper = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 100 );
    var zClippingPlaneUpper2 = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 100 );

    var slice_image_cache = {};

    var active_nodes = [];

    init();

    showLoadingOverlay();
    window.setTimeout(function() {
        loadModels();
    }, 1000);


    var status = [];
    function displayStatus(node) {
        var html = "<h3>" + node.original.text + "</h3>";
        for (var i = 0; i < status.length; i++) {
            html += "<div style='font-size: 12px; font-style: italic; color: #666666; line-height: 1.1em; max-height: 53px; overflow: auto;'>" + status[i].message + "</div>";
        }
        $("#status").html(html);
    }
    function setStatusLoading3D(node) {
        removeStatus3D(node);
        status.push({
            message: "Loading 3D model for " + node.original.text + "...",
            node: node
        });
        displayStatus(node);
    }
    function setStatusFailed3D(node) {
        removeStatus3D(node);
        status.push({
            message: "No 3D model available for " + node.original.text + ". Try a different brain region.",
            node: node
        });
        displayStatus(node);
    }
    function setStatusBorrowed(node) {
        removeStatus3D(node);
        status.push({
            message: "Showing models for " + node.original.borrowed_models.join(", ").replace(/_/g, " ") + ".",
            node: node
        });
        displayStatus(node);
    }
    function removeStatus3D(node) {
        removeByValue(status, getStatus3D(node));
        displayStatus(node);
    }
    function getStatus3D(node) {
        for (var i = 0; i < status.length; i++) {
            if ("node" in status[i] && status[i].node == node) {
                return status[i];
            }
        }
        return undefined;
    }

    function showLoadingOverlay() {
        $("#card-brain").LoadingOverlay("show", {
            "imageColor": "#747474"
        });
    }

    function hideLoadingOverlay() {
        $("#card-brain").LoadingOverlay("hide");
    }

    function updateProgress(progress) {
        if (DEBUG) return;
        /*progress.Update(
            Math.round( 100 * (
                progress
            ))
        );*/
    }

    function loadModel(path, loader) {
        loader.load( URL + path, function(geometry) {

            //geometry.center();
            //geometry.computeVertexNormals();
            //geometry.addAttribute('alphaValue', new THREE.BufferAttribute(new Float32Array(alphaArray), 1));
            geometries[path] = geometry;
        }, function(p) {

        } );
    }

    function loadModels() {
        //animate();
        //return;

        var manager = new THREE.LoadingManager();

        manager.onLoad = function ( ) {
            createBrain();
            animate();
            hideLoadingOverlay();
        };
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            // todo: turn this into a percentage and display it in the progress bar
        };

        var vtkLoader = new THREE.VTKLoader(manager);
        loadModel("models/mni_brain.vtk", vtkLoader);
        //var stlLoader = new THREE.STLLoader(manager);
        //loadModel("models/brodmann_brain.stl", stlLoader);
        //loadModel("models/jubrain-mpm-surf.vtk", vtkLoader);
        //loadModel("models/mni_grey.vtk", vtkLoader);
        //loadModel("models/mni_white.vtk", vtkLoader);
        //loadModel("models/mni_csf.vtk", vtkLoader);
    }

    function createViews() {
        for (var view in views) {

            containers[view] = document.getElementById("container_" + view);
            scenes[view] = new THREE.Scene();

            scenes_brain_regions[view] = new THREE.Scene();

            // Camera
            cameras[view] = new THREE.PerspectiveCamera( 60, $(containers[view]).width() / $(containers[view]).height(), 10, 1000 );
            var camera_pos = views[view]["pos"].clone().normalize().multiplyScalar(default_camera_distance);
            console.log("Set camera pos", camera_pos);
            cameras[view].position.set(camera_pos.x, camera_pos.y, camera_pos.z);
            cameras[view].lookAt(new THREE.Vector3(0, 0, 0));
            scenes[view].add( cameras[view] );

            cameras_brain_regions[view] = new THREE.PerspectiveCamera( 60, $(containers[view]).width() / $(containers[view]).height(), 0.01, 1e10 );
            cameras_brain_regions[view].position.set(camera_pos.x, camera_pos.y, camera_pos.z);
            cameras_brain_regions[view].lookAt(new THREE.Vector3(0, 0, 0));
            scenes_brain_regions[view].add( cameras_brain_regions[view] );

            // Light
            //lights[view] = new THREE.DirectionalLight( 0xaaaaaa );
            lights[view] = new THREE.DirectionalLight( 0xaaaaaa );
            lights[view].position.set( 1, 0, 0 );
            cameras[view].add( lights[view] );

            var ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
            scenes[view].add( ambientLight );

            lights_brain_regions[view] = new THREE.DirectionalLight( 0xaaaaaa );
            lights_brain_regions[view].position.set( 1, 0, 0 );
            cameras_brain_regions[view].add( lights_brain_regions[view] );

            // Build renderer
            renderers[view] = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
            renderers[view].setPixelRatio( window.devicePixelRatio );
            console.log("set renderer size ", $(containers[view]).width(), $(containers[view]).height());
            renderers[view].setSize( $(containers[view]).width(), $(containers[view]).height() );
            renderers[view].sortObjects = false;
            renderers[view].autoClear = false;
            renderers[view].localClippingEnabled = true;
            containers[view].appendChild( renderers[view].domElement );
        }
    }

    function createMaterials() {
        //var grey_texture = new THREE.TextureLoader().load('img/brain_texture.jpg');
        /*materials["grey"] = createSubgeomMaterial({
            color: 0xd2b8a3,
            opacity: 1,
            transparent: true,
            side: THREE.DoubleSide
        });
        materials["white"] = createSubgeomMaterial({
            color: 0xfefaf7,
            opacity: 1,
            transparent: true,
            side: THREE.DoubleSide
        });
        materials["csf"] = createSubgeomMaterial({
            color: 0x96a2c8,
            opacity: 0.5,
            transparent: true,
            visible: false,
            side: THREE.DoubleSide
        });*/

        materials["grey"] = new THREE.MeshPhongMaterial( {
            color: 0xd2b8a3,
            side: THREE.DoubleSide,
            opacity: 1,
            transparent: true,
            skinning: true,
            clipping: true,
            shading: THREE.SmoothShading,
            flatShading: false,
            clippingPlanes: [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper]
        } );
        materials["white"] = new THREE.MeshPhongMaterial( {
            color: 0xfefaf7,
            side: THREE.DoubleSide,
            opacity: 1,
            transparent: true,
            clipping: true,
            clippingPlanes: [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper]
        } );
        materials["csf"] = new THREE.MeshBasicMaterial( {
            color: 0x96a2c8,
            side: THREE.DoubleSide,
            opacity: 0.5,
            transparent: true,
            visible: false,
            clipping: true,
            clippingPlanes: [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper]
        } );

        //materials["grey_opaque"] = new THREE.MeshPhongMaterial( { color: 0xd2b8a3, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );
        //materials["white_opaque"] = new THREE.MeshPhongMaterial( { color: 0xfefaf7, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );
        //materials["csf_opaque"] = new THREE.MeshBasicMaterial( { color: 0x96a2c8, side: THREE.DoubleSide, opacity: 0.1, transparent: true } );

    }

    function createBrain() {
        for (var view in views) {
            brain_grey_meshes[view] = new THREE.Mesh( geometries["models/mni_brain.vtk"], materials["grey"] );
            brain_grey_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            //brain_grey_meshes[view].onBeforeRender = function( renderer ) { renderer.clearDepth(); };
            //brain_grey_meshes[view].scale.multiplyScalar(0.000001);
            scenes[view].add( brain_grey_meshes[view] );

            /*brain_white_meshes[view] = new THREE.Mesh( geometries["models/mni_white.vtk"], materials["white"] );
            brain_white_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            scenes[view].add( brain_white_meshes[view] );

            brain_csf_meshes[view] = new THREE.Mesh( geometries["models/mni_csf.vtk"], materials["csf"] );
            brain_csf_meshes[view].rotation.set(-Math.PI/2, 0, 0);
            scenes[view].add( brain_csf_meshes[view] );*/
        }
        /*var brain_grey_opaque = new THREE.Mesh( geometries["models/mni_grey.vtk"], materials["grey_opaque"] );
        brain_grey_opaque.rotation.set(-Math.PI/2, 0, 0);
        scenes["3d"].add( brain_grey_opaque );*/

        /*var brain_inside = new THREE.Mesh( geometry, grey_material_inside );
        brain_inside.rotation.set(-Math.PI/2, 0, 0);
        brain_inside.renderOrder = 1000;
        brain_inside.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
        scenes["3d"].add( brain_inside );*/


        /*vtkLoader.load( "models/mni_head.vtk", function ( geometry ) {

            geometry.center();
            geometry.computeVertexNormals();
            var head_material = new THREE.MeshPhongMaterial( { color: 0xffd4bf, side: THREE.DoubleSide, opacity: 1, transparent: true } );

            for (var view in views) {

                var head_outside = new THREE.Mesh( geometry, head_material );
                head_outside.rotation.set(-Math.PI/2, 0, 0);
                head_outside.scale.multiplyScalar( scale );
                scenes[view].add( head_outside );
            }

        } );*/
    }

    function init() {
        createViews();
        createMaterials();
        createSliceImagePlanes();
        createSliceRegionImagePlanes();

        // On resize: Resize
        window.addEventListener( 'resize', onWindowResize, false );

        // Build controls
        controls = new THREE.OrbitControls( cameras["3d"], containers["3d"] );
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.autoRotate = true;
        controls.maxDistance = 900;

        containers["3d"].addEventListener( 'mousedown', function() {
            controls.autoRotate = false;
            $("#rotate").prop("checked", false);
        }, false );

        // Add stats
        stats = new Stats();
        containers["3d"].appendChild(stats.dom);
        //stats.dom.style.top = "80px";
    }

    function createSliceImagePlanes() {
        for (var view in views) {

            slice_image_planes[view] = {
                'x': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(y_width, z_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [yClippingPlaneLower2, yClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(y_width, z_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [yClippingPlaneLower2, yClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    )
                },
                'y': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(z_width, x_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, yClippingPlaneLower2, yClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(z_width, x_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, yClippingPlaneLower2, yClippingPlaneUpper2]
                        })
                    )
                },
                'z': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(x_width, y_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(x_width, y_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.3,
                            side: THREE.DoubleSide,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    )
                }
            };

            slice_image_planes[view]['x']['lower'].position.set(0, z_center, -y_center);
            slice_image_planes[view]['x']['upper'].position.set(0, z_center, -y_center);
            slice_image_planes[view]['x']['lower'].rotation.set(0, Math.PI/2, 0);
            slice_image_planes[view]['x']['upper'].rotation.set(0, Math.PI/2, 0);
            scenes[view].add(slice_image_planes[view]['x']['lower']);
            scenes[view].add(slice_image_planes[view]['x']['upper']);

            slice_image_planes[view]['y']['lower'].position.set(0, z_center, 0);
            slice_image_planes[view]['y']['upper'].position.set(0, z_center, 0);
            slice_image_planes[view]['y']['lower'].rotation.set(0, 0, Math.PI/2);
            slice_image_planes[view]['y']['upper'].rotation.set(0, 0, Math.PI/2);
            scenes[view].add(slice_image_planes[view]['y']['lower']);
            scenes[view].add(slice_image_planes[view]['y']['upper']);

            slice_image_planes[view]['z']['lower'].position.set(0, z_center, -y_center);
            slice_image_planes[view]['z']['upper'].position.set(0, z_center, -y_center);
            slice_image_planes[view]['z']['lower'].rotation.set(Math.PI/2, 0, 0);
            slice_image_planes[view]['z']['upper'].rotation.set(Math.PI/2, 0, 0);
            scenes[view].add(slice_image_planes[view]['z']['lower']);
            scenes[view].add(slice_image_planes[view]['z']['upper']);
        }
    }


    function createSliceRegionImagePlanes() {
        for (var view in views) {

            slice_region_image_planes[view] = {
                'x': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(y_width, z_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_x']['lower'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [yClippingPlaneLower2, yClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(y_width, z_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_x']['upper'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [yClippingPlaneLower2, yClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    )
                },
                'y': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(z_width, x_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_y']['lower'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, yClippingPlaneLower2, yClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(z_width, x_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_y']['upper'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, yClippingPlaneLower2, yClippingPlaneUpper2]
                        })
                    )
                },
                'z': {
                    'lower': new THREE.Mesh(
                        new THREE.PlaneGeometry(x_width, y_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_z']['lower'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    ),
                    'upper': new THREE.Mesh(
                        new THREE.PlaneGeometry(x_width, y_width),
                        new THREE.MeshBasicMaterial({
                            transparent: true,
                            alphaTest: 0.1,
                            side: THREE.DoubleSide,
                            map: new THREE.Texture( slice_region_canvases['combined_z']['upper'] ),
                            opacity: default_opacity_2d,
                            clippingPlanes: [xClippingPlaneLower2, xClippingPlaneUpper2, zClippingPlaneLower2, zClippingPlaneUpper2]
                        })
                    )
                }
            };

            slice_region_image_planes[view]['x']['lower'].position.set(0, z_center, -y_center);
            slice_region_image_planes[view]['x']['upper'].position.set(0, z_center, -y_center);
            slice_region_image_planes[view]['x']['lower'].rotation.set(0, Math.PI/2, 0);
            slice_region_image_planes[view]['x']['upper'].rotation.set(0, Math.PI/2, 0);
            scenes[view].add(slice_region_image_planes[view]['x']['lower']);
            scenes[view].add(slice_region_image_planes[view]['x']['upper']);

            slice_region_image_planes[view]['y']['lower'].position.set(0, z_center, 0);
            slice_region_image_planes[view]['y']['upper'].position.set(0, z_center, 0);
            slice_region_image_planes[view]['y']['lower'].rotation.set(0, 0, Math.PI/2);
            slice_region_image_planes[view]['y']['upper'].rotation.set(0, 0, Math.PI/2);
            scenes[view].add(slice_region_image_planes[view]['y']['lower']);
            scenes[view].add(slice_region_image_planes[view]['y']['upper']);

            slice_region_image_planes[view]['z']['lower'].position.set(0, z_center, -y_center);
            slice_region_image_planes[view]['z']['upper'].position.set(0, z_center, -y_center);
            slice_region_image_planes[view]['z']['lower'].rotation.set(Math.PI/2, 0, 0);
            slice_region_image_planes[view]['z']['upper'].rotation.set(Math.PI/2, 0, 0);
            scenes[view].add(slice_region_image_planes[view]['z']['lower']);
            scenes[view].add(slice_region_image_planes[view]['z']['upper']);
        }
    }

    function onWindowResize() {
        for (var view in views) {
            cameras[view].aspect = $(containers[view]).width() / $(containers[view]).height();
            cameras[view].updateProjectionMatrix();
            cameras_brain_regions[view].aspect = $(containers[view]).width() / $(containers[view]).height();
            cameras_brain_regions[view].updateProjectionMatrix();
            renderers[view].setSize( $(containers[view]).width(), $(containers[view]).height() );
        }



        /*if ("handleResize" in controls) {
            controls.handleResize();
        }*/

    }

    function animate() {

        requestAnimationFrame( animate );
        controls.update();

        // Update 3D opacity
        if (flash) {
            var n = new Date().getTime();
            var loopProgress = (n % 5000) / 5000;
            for (var view in views) {
                var count = 0;
                scenes_brain_regions[view].traverse(function(node) {
                    count++;
                });

                var i = 0;
                scenes_brain_regions[view].traverse(function(node) {
                    if ( node instanceof THREE.Mesh ) {
                        node.material.opacity = default_opacity_3d * (1 + Math.sin(((1.0/count * i)%1 + loopProgress) * 2 * Math.PI)) / 2;
                    }
                    i++;
                });
            }
        }

        // Custom rotate
        if (rotateDirection[0] != 0) {
            controls.rotateLeft(rotateDirection[0] * 0.01);
        }
        if (rotateDirection[1] != 0) {
            controls.rotateUp(rotateDirection[1] * 0.01);
        }

        // Custom zoom
        if (zoomDirection > 0) {
            controls.dollyIn(1.01*zoomDirection);
        } else if (zoomDirection < 0) {
            controls.dollyOut(1.01*-zoomDirection);
        }


        for (var view in views) {
            cameras_brain_regions[view].position.set(cameras[view].position.x, cameras[view].position.y, cameras[view].position.z);
            cameras_brain_regions[view].rotation.set(cameras[view].rotation.x, cameras[view].rotation.y, cameras[view].rotation.z);


            renderers[view].render( scenes[view], cameras[view] );

            renderers[view].clearDepth();
            renderers[view].render( scenes_brain_regions[view], cameras_brain_regions[view] );


            //renderers[view].clippingPlanes = [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper];
            //renderers[view].render( scenes_brain_regions_opaque[view], cameras[view] );
        }

        stats.update();
    }



    return {
        setShowGrayMatter: function(show) {
            materials["grey"].visible = show;
        },
        setShowWhiteMatter: function(show) {
            materials["white"].visible = show;
        },
        setShowCSF: function(show) {
            materials["csf"].visible = show;
        },

        slice: function(x, y, z) {

            xClippingPlaneLower.constant = -x[0]-0.4;
            xClippingPlaneLower2.constant = -x[0];
            xClippingPlaneUpper.constant = x[1]-0.4;
            xClippingPlaneUpper2.constant = x[1];
            yClippingPlaneLower.constant = -z[0]-0.4;
            yClippingPlaneLower2.constant = -z[0];
            yClippingPlaneUpper.constant = z[1]-0.4;
            yClippingPlaneUpper2.constant = z[1];
            zClippingPlaneLower.constant = y[1]-0.4;
            zClippingPlaneLower2.constant = y[1];
            zClippingPlaneUpper.constant = -y[0]-0.4;
            zClippingPlaneUpper2.constant = -y[0];

            this.slice_x = x;
            this.slice_y = y;
            this.slice_z = z;
            this.updateSliceImages();
            this.updateSliceRegionImages();
        },

        updateSliceImages: function() {
            var x = this.slice_x;
            var y = this.slice_y;
            var z = this.slice_z;
            for (var view in views) {
                slice_image_planes[view]["x"]["lower"].position.x = x[0];
                slice_image_planes[view]["x"]["lower"].material.map = this.loadSliceImage("x", x[0]);
                slice_image_planes[view]["x"]["lower"].material.needsUpdate = true;
                slice_image_planes[view]["x"]["upper"].position.x = x[1];
                slice_image_planes[view]["x"]["upper"].material.map = this.loadSliceImage("x", x[1]);
                slice_image_planes[view]["x"]["upper"].material.needsUpdate = true;

                slice_image_planes[view]["y"]["lower"].position.z = -y[0];
                slice_image_planes[view]["y"]["lower"].material.map = this.loadSliceImage("y", y[0]);
                slice_image_planes[view]["y"]["lower"].material.needsUpdate = true;
                slice_image_planes[view]["y"]["upper"].position.z = -y[1];
                slice_image_planes[view]["y"]["upper"].material.map = this.loadSliceImage("y", y[1]);
                slice_image_planes[view]["y"]["upper"].material.needsUpdate = true;

                slice_image_planes[view]["z"]["lower"].position.y = z[0];
                slice_image_planes[view]["z"]["lower"].material.map = this.loadSliceImage("z", z[0]);
                slice_image_planes[view]["z"]["lower"].material.needsUpdate = true;
                slice_image_planes[view]["z"]["upper"].position.y = z[1];
                slice_image_planes[view]["z"]["upper"].material.map = this.loadSliceImage("z", z[1]);
                slice_image_planes[view]["z"]["upper"].material.needsUpdate = true;
            }

        },

        updateSliceRegionImages: function() {
            var x = this.slice_x;
            var y = this.slice_y;
            var z = this.slice_z;
            for (var view in views) {
                slice_region_image_planes[view]["x"]["lower"].position.x = x[0];
                this.updateSliceRegionImage(view, "x", "lower", x[0]);

                slice_region_image_planes[view]["x"]["upper"].position.x = x[1];
                this.updateSliceRegionImage(view, "x", "upper", x[1]);

                slice_region_image_planes[view]["y"]["lower"].position.z = -y[0];
                this.updateSliceRegionImage(view, "y", "lower", y[0]);

                slice_region_image_planes[view]["y"]["upper"].position.z = -y[1];
                this.updateSliceRegionImage(view, "y", "upper", y[1]);

                slice_region_image_planes[view]["z"]["lower"].position.y = z[0];
                this.updateSliceRegionImage(view, "z", "lower", z[0]);

                slice_region_image_planes[view]["z"]["upper"].position.y = z[1];
                this.updateSliceRegionImage(view, "z", "upper", z[1]);
            }
        },

        setMniImage: function(_mni_image) {
            mni_image = _mni_image;
            this.updateSliceImages();
        },

        loadSliceImage: function(axis, coordinate) {
            var path = URL + "models/generated/slices/" + mni_image + "_" + axis + "_" + Math.round(coordinate) + ".png";
            if (!(path in slice_image_cache)) {
                slice_image_cache[path] = textureLoader.load(path);
            }
            return slice_image_cache[path];
        },

        updateSliceRegionImage: function(view, axis, side, coordinate) {

            var combined_canvas = slice_region_canvases["combined_" + axis][side];
            var combined_ctx = combined_canvas.getContext("2d");
            combined_ctx.clearRect(0, 0, combined_canvas.width, combined_canvas.height);
            slice_region_image_planes[view][axis][side].material.map.needsUpdate = true;

            var single_canvas = slice_region_canvases["single_" + axis];
            var single_ctx = single_canvas.getContext("2d");

            function drawNodeRegionImage(node, region_image) {
                single_ctx.clearRect(0, 0, single_canvas.width, single_canvas.height);
                single_ctx.drawImage(region_image, 0, 0);

                // Tint
                var rgb = colorToRGB(node.color);

                var single_img_data = single_ctx.getImageData(0, 0, single_canvas.width, single_canvas.height);
                for (var i=0;i<single_img_data.data.length;i+=4)
                {
                    if (single_img_data.data[i] != 0) {
                        //img_data.data[i] = rgb[0] | img_data.data[i];
                        //img_data.data[i + 1] = rgb[1] | img_data.data[i + 1];
                        //img_data.data[i + 2] = rgb[2] | img_data.data[i + 2];
                        single_img_data.data[i] = rgb[0];
                        single_img_data.data[i + 1] = rgb[1];
                        single_img_data.data[i + 2] = rgb[2];
                    }
                }
                single_ctx.putImageData(single_img_data,0,0);
                combined_ctx.drawImage(single_canvas, 0, 0);

                slice_region_image_planes[view][axis][side].material.map.needsUpdate = true;
            }



            for (var i = 0; i < active_nodes.length; i++) {
                var node = active_nodes[i];
                var path = URL + "models/generated/regions/" + node.id + "_" + axis + "_" + Math.round(coordinate) + ".png";

                var region_image = new Image();
                region_image.src = path;
                region_image.addEventListener('load', drawNodeRegionImage.bind(this, node, region_image));
            }
        },

        addNode: function(node, color) {
            active_nodes.push(node);

            var brain_region_material_solid = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: 1,
                transparent: true,
                clippingPlanes: [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper]
            });

            var brain_region_material = new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                opacity: default_opacity_3d,
                transparent: true,
                depthWrite: false,
                clippingPlanes: [xClippingPlaneLower, xClippingPlaneUpper, yClippingPlaneLower, yClippingPlaneUpper, zClippingPlaneLower, zClippingPlaneUpper]
            });

            if (typeof(node.meshes) == "undefined") {
                node.meshes = {};
                //node.meshes_solid = {};
                node.meshes_slices = {};

                for (var view in views) {

                    var mesh = new THREE.Mesh();
                    mesh.node = node;
                    node.meshes[view] = mesh;

                    /*var mesh_solid = new THREE.Mesh();
                    mesh_solid.node = node;
                    node.meshes_solid[view] = mesh_solid;*/

                }

                var stlLoader = new THREE.STLLoader();
                setStatusLoading3D(node);
                console.log("Load: " + "models/generated/3d/" + node.id + ".stl");
                stlLoader.load(URL + "models/generated/3d/" + node.id + ".stl", function (geometry) {
                    if ("borrowed_models" in node.original) {
                        setStatusBorrowed(node);
                    } else {
                        removeStatus3D(node);
                    }

                    //geometry.computeVertexNormals(true);
                    //geometry.center();
                    geometry.rotateX(Math.PI / 2);
                    geometry.rotateY(-Math.PI);
                    geometry.translate(89, 109, 125);

                    for (var view in views) {
                        node.meshes[view].geometry = geometry;
                        //node.meshes_solid[view].geometry = geometry;
                    }

                }, null, function() {
                    setStatusFailed3D(node);
                });
            }

            for (var view in views) {
                node.meshes[view].material = brain_region_material;
                //node.meshes_solid[view].material = brain_region_material_solid;
                scenes_brain_regions[view].add(node.meshes[view]);
                //scenes[view].add(node.meshes_solid[view]);
            }

            console.log("added node", node.original.text);

            this.updateSliceRegionImages();

        },

        removeNode: function(node) {
            var index = active_nodes.indexOf(node);
            if (index > -1) {
                active_nodes.splice(index, 1);
            }

            for (var view in views) {
                scenes_brain_regions[view].remove(node.meshes[view]);
                //scenes[view].remove(node.meshes_solid[view]);
            }

            removeStatus3D(node);
            this.updateSliceRegionImages();
        },

        setFlash: function(f) {
            flash = f;
            for (var view in views) {
                scenes_brain_regions[view].traverse(function(node) {

                    if ( node instanceof THREE.Mesh ) {

                        // insert your code here, for example:
                        node.material.opacity = default_opacity_3d;

                    }
                });
            }
        },

        setAutoRotate: function(autoRotate) {
            controls.autoRotate = autoRotate;
        },

        setOpacity2D: function(opacity) {
            default_opacity_2d = opacity;

            for (var view in views) {
                slice_region_image_planes[view]["x"]["lower"].material.opacity = opacity;
                slice_region_image_planes[view]["x"]["upper"].material.opacity = opacity;
                slice_region_image_planes[view]["y"]["lower"].material.opacity = opacity;
                slice_region_image_planes[view]["y"]["upper"].material.opacity = opacity;
                slice_region_image_planes[view]["z"]["lower"].material.opacity = opacity;
                slice_region_image_planes[view]["z"]["upper"].material.opacity = opacity;
            }
        },

        setOpacity3D: function(opacity) {
            default_opacity_3d = opacity;
            if (!flash) {
                for (var view in views) {
                    scenes_brain_regions[view].traverse(function(node) {

                        if ( node instanceof THREE.Mesh ) {

                            // insert your code here, for example:
                            node.material.opacity = default_opacity_3d;

                        }
                    });
                }
            }
        },

        startRotate: function(direction) {
            rotateDirection = direction;
            this.setAutoRotate(false);
            $("#rotate").prop("checked", false);
        },

        stopRotate: function() {
            rotateDirection = [0, 0];
        },

        startZoom: function(direction) {
            zoomDirection = direction;
            this.setAutoRotate(false);
            $("#rotate").prop("checked", false);
        },

        stopZoom: function() {
            zoomDirection = 0;
        },

        resetView: function() {
            controls.reset();
            this.setAutoRotate(true);
            $("#rotate").prop("checked", true);
        },

        saveImage: function(view) {
            if (typeof(view) == "undefined") view = "3d";
            renderers[view].render( scenes[view], cameras[view] );
            renderers[view].clearDepth();
            renderers[view].render( scenes_brain_regions[view], cameras_brain_regions[view] );
            var dataURL = renderers["3d"].domElement.toDataURL();

            $("#modal .modal-title").html("Screenshot");
            $("#modal .modal-body").html("Right-click the image and click on 'save image as'. If you plan to use this image, please reference brain.deepideas.net as a source.<img src='" + dataURL + "' style='width: 100%;'>");
            $("#modal").modal("show");
        }
    }
})();
