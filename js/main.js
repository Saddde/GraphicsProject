		var popup = [];
	var mus = { //"mus" for MUSeum used as a "main" variable of sorts.
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
		renderer: new THREE.WebGLRenderer({antialias: false}),
		raycaster: new THREE.Raycaster(),
		mouse: new THREE.Vector3(),
        var : viewDist2=0.045,

        buildGui : function() {
            gui = new dat.GUI();
            var params = {
                viewDistance : viewDist2
            }

            gui.add( params, 'viewDistance', 0.01, 0.2 ).onChange( function ( val ) {
                viewDist2 = 0.2-val;
                mus.refreshFog();

            } );

            gui.open();
        },

		raycastSetUp: function() {
			mus.mouse.x = 0; //(0.5) * 2 - 1;
			mus.mouse.y = 0; //(0.5) * 2 + 1;
			mus.mouse.z = 0.0001;
		},
		boot: function() {
			//renderer time delta
			mus.prevTime = performance.now();
            mus.initialRender = true;

			mus.scene.fog = new THREE.FogExp2(0x666666, viewDist2);

			mus.renderer.setSize(window.innerWidth, window.innerHeight);
			mus.renderer.setClearColor(0xffffff, 1);
			document.body.appendChild(mus.renderer.domElement);

            mus.userBoxGeo = new THREE.BoxGeometry(2,1,2);
            mus.userBoxMat = new THREE.MeshBasicMaterial({color: 0xeeee99, wireframe: true});
            mus.user = new THREE.Mesh(mus.userBoxGeo, mus.userBoxMat);

            //invisible since this will solely be used to determine the size
            //of the bounding box of our boxcollider for the user
            mus.user.visible = false;

            //making Bounding Box
            //boundingbox is used for collisions
            mus.user.BBox = new THREE.Box3();

            //make our collision object a child of the camera
            mus.camera.add(mus.user);

			mus.controls = new THREE.PointerLockControls(mus.camera);
			mus.scene.add( mus.controls.getObject());

            mus.pastX = mus.controls.getObject().position.x;
            mus.pastZ = mus.controls.getObject().position.z;

			//https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
			mus.canvas = document.querySelector('canvas');
			mus.canvas.className = "muslery";

            //Clicking on either of these will start the game
            mus.bgMenu = document.querySelector('#background_menu');
            mus.play = document.querySelector('#play_button');

			//enabling/disabling menu based on pointer controls
			mus.menu = document.getElementById("menu");

			//only when pointer is locked will translation controls be allowed: mus.controls.enabled
			mus.moveVelocity = new THREE.Vector3();
			mus.jump = true;
			mus.moveForward = false;
			mus.moveBackward = false;
			mus.moveLeft = false;
			mus.moveRight = false;

			//Resize if window size change!
			window.addEventListener('resize', function() {
				mus.renderer.setSize(window.innerWidth, window.innerHeight);
				mus.camera.aspect = window.innerWidth / window.innerHeight;
				mus.camera.updateProjectionMatrix();
			});

		},




		pointerControls: function() {
			//////POINTER LOCK AND FULL SCREEN////////////
			//https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
			//if pointer lock supported in browser:
			if('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
				//assign the API functions for pointer lock based on browser
				mus.canvas.requestPointerLock = mus.canvas.requestPointerLock || mus.canvas.mozRequestPointerLock || mus.canvas.webkitRequestPointerLock;
				//run this function to escape pointer Lock
				mus.canvas.exitPointerLock =  mus.canvas.exitPointerLock || mus.canvas.mozExitPointerLock || mus.canvas.webkitExitPointerLock;

				//https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
				//https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
				document.addEventListener("keydown", function(e) {
					if(e.keyCode === 102 || e.keyCode === 70) {//F/f for fullscreen hahaha
						mus.toggleFullscreen();
						//refer to below event listener:
						mus.canvas.requestPointerLock();
					}
				});


				/*Order of executions:
				mus.canvas "click" -> "pointerlockchange" -> gl.changeCallback
				-> listen to mouse movement and locked

				ESC key -> "pointerlockchange" -> gl.changeCallback -> unlocked
				now listen to when the canvas is clicked on
				*/

                /* Following is unclickable since it's covered by bgMenu div
				mus.canvas.addEventListener("click", function() {
					mus.canvas.requestPointerLock();
				});
                */

                mus.bgMenu.addEventListener("click", function() {
					mus.canvas.requestPointerLock();
                });
                mus.play.addEventListener("click", function() {
					mus.canvas.requestPointerLock();
                });

				//pointer lock state change listener
				document.addEventListener('pointerlockchange', mus.changeCallback, false);
				document.addEventListener('mozpointerlockchange', mus.changeCallback, false);
				document.addEventListener('webkitpointerlockchange', mus.changeCallback, false);

				document.addEventListener('pointerlockerror', mus.errorCallback, false);
				document.addEventListener('mozpointerlockerror', mus.errorCallback, false);
				document.addEventListener('webkitpointerlockerror', mus.errorCallback, false);


			} else {
				alert("Your browser does not support the Pointer Lock API");
			}
		},

		changeCallback: function(event) {
			if(document.pointerLockElement === mus.canvas || document.mozPointerLockElement === mus.canvas || document.webkitPointerLockElement === mus.canvas) {
				//pointer is disabled by element
				mus.controls.enabled = true;
				//remove menu element from screen
				mus.menu.className += " hide";
                mus.bgMenu.className += " hide";
				//start mouse move listener
				document.addEventListener("mousemove", mus.moveCallback, false);

			} else {
				//pointer is no longer disabled
				mus.controls.enabled = false;
				//remove hidden property from menu
				mus.menu.className = mus.menu.className.replace(/(?:^|\s)hide(?!\S)/g, '');
				mus.bgMenu.className = mus.bgMenu.className.replace(/(?:^|\s)hide(?!\S)/g, '');
				document.removeEventListener("mousemove", mus.moveCallback, false);
			}
		},

		moveCallback: function(event) {
			//now that pointer disabled, we get the movement in x and y pos of the mouse
			var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		},

		movement: function() {
				document.addEventListener("keydown", function(e) {
					if(e.keyCode === 87 || e.keyCode === 38) { //w or UP
						mus.moveForward = true;
					}
					else if(e.keyCode === 65 || e.keyCode === 37) { //A or LEFT
						mus.moveLeft = true;
					}
					else if(e.keyCode === 83 || e.keyCode === 40) { //S or DOWN
						mus.moveBackward = true;
					}
					else if(e.keyCode === 68 || e.keyCode === 39) { //D or RIGHT
						mus.moveRight = true;
					}
					else if(e.keyCode ===  32) { //Spacebar
						if(mus.jump) {
							mus.moveVelocity.y += 10;
							mus.jump = false;
						}
					}
				});

				document.addEventListener("keyup", function(e) {
					if(e.keyCode === 87 || e.keyCode === 38) { //w or UP
						mus.moveForward = false;
					}
					else if(e.keyCode === 65 || e.keyCode === 37) { //A or LEFT
						mus.moveLeft = false;
					}
					else if(e.keyCode === 83 || e.keyCode === 40) { //S or DOWN
						mus.moveBackward = false;
					}
					else if(e.keyCode === 68 || e.keyCode === 39) { //D or RIGHT
						mus.moveRight = false;
					}
				});
		},
		
		click: function(){
			
		},
		
		create: function() {

			//let there be light!
			mus.worldLight = new THREE.DirectionalLight(0xffffff, 1.0);
			mus.worldLight.position.set(5, 0, -5).normalize();
			mus.worldLight2 = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1);
			mus.worldLight3 = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
			mus.worldLight4 = new THREE.AmbientLight(0xffff00, 0.1);
			mus.scene.add(mus.worldLight);
			mus.scene.add(mus.worldLight2);
			mus.scene.add(mus.worldLight3);
			mus.scene.add(mus.worldLight4);

            //set the floor up
            mus.floorText = THREE.ImageUtils.loadTexture("img/Textures/Floor.jpg");
            mus.floorText.wrapS = THREE.RepeatWrapping;
            mus.floorText.wrapT = THREE.RepeatWrapping;
            mus.floorText.repeat.set(24,24);

            //Phong is for shiny surfaces
			mus.floorMaterial = new THREE.MeshPhongMaterial( {map: mus.floorText } );
			mus.floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mus.floorMaterial);

			mus.floor.rotation.x = Math.PI/2;
            mus.floor.rotation.y = Math.PI;
			mus.scene.add(mus.floor);

			//Create the walls////
			mus.wallGroup = new THREE.Group();
			mus.scene.add(mus.wallGroup);

			mus.wall1 = new THREE.Mesh(new THREE.BoxGeometry(20,6, 0.001), new THREE.MeshLambertMaterial({color: 0xff0000}));
			mus.wall2 = new THREE.Mesh(new THREE.BoxGeometry(20,6, 0.001), new THREE.MeshLambertMaterial({color: 0x0400ff}));
			mus.wall3 = new THREE.Mesh(new THREE.BoxGeometry(20,6, 0.001), new THREE.MeshLambertMaterial({color: 0x20d600}));
			mus.wall4 = new THREE.Mesh(new THREE.BoxGeometry(20,6, 0.001), new THREE.MeshLambertMaterial({color: 0xd68300}));

			mus.wallGroup.add(mus.wall1, mus.wall2, mus.wall3, mus.wall4);
			mus.wallGroup.position.y = 3;

			mus.wall1.position.z = -10;
			mus.wall2.position.x = -10;
			mus.wall2.rotation.y = Math.PI/2;
			mus.wall3.position.x = 10;
			mus.wall3.rotation.y = -Math.PI/2;
			mus.wall4.position.z = 10;
			mus.wall4.rotation.y = Math.PI;

            for(var i = 0; i < mus.wallGroup.children.length; i++) {
                mus.wallGroup.children[i].BBox = new THREE.Box3();
                mus.wallGroup.children[i].BBox.setFromObject(mus.wallGroup.children[i]);
            }

			//Ceiling//
			mus.ceilMaterial = new THREE.MeshLambertMaterial({color: 0x8DB8A7});
			mus.ceil = new THREE.Mesh(new THREE.PlaneGeometry(20,20), mus.ceilMaterial);
			mus.ceil.position.y = 6;
			mus.ceil.rotation.x = Math.PI/2;
			mus.scene.add(mus.ceil);

            /*///////Add 3D imported Objects ////
            mus.objects = [];
            //OBJ to JSON converter Python Tool
            //three.js/utils/converters/obj/convert_obj_three.py
            //python convert_obj_tree.py -i teapot.obj -o teapot.js
            mus.loader = new THREE.JSONLoader();
            mus.loader.load(".\\objects\\icosphere.json", function(geometry, materials) {
                var materialIco = new THREE.MeshNormalMaterial();
                mus.ico = new THREE.Mesh(geometry, materialIco);
                mus.ico.position.y = 2;
                mus.ico.position.x = 18;
                mus.ico.scale.set(0.25, 0.25, 0.25);
                mus.scene.add(mus.ico);
                mus.objects.push(mus.ico);
            });
            
            //Process for importing more objects is pretty straight forward
            mus.loader.load(".\\objects\\icosphere.json", function(geometry, materials) {
                var materialIco = new THREE.MeshNormalMaterial();
                mus.ico2 = new THREE.Mesh(geometry, materialIco);
                mus.ico2.position.x = 1;
                mus.scene.add(mus.ico2);
            });*/
			
			//Adding local obj models
			mus.objects = [];
			var loader1 = new THREE.OBJLoader();
			var loader2 = new THREE.OBJLoader();
			var loader3 = new THREE.OBJLoader();
			var loader4 = new THREE.OBJLoader();
			var loader5 = new THREE.OBJLoader();
			var loader6 = new THREE.OBJLoader();
			var material = new THREE.MeshBasicMaterial({color : 0x00ff00});
			// load a resource
			
			
			loader1.load(
				'models/1.obj', //Banana
				function ( object ) {
					var mesh = object;
					mus.scene.add( mesh );
					mesh.scale.set(0.005,0.005,0.005);
					mesh.position.set(-7, 0, 7);
					mus.objects.push(mesh);
				},
			);
			var mtlLoader2 = new THREE.MTLLoader();
			mtlLoader2.setTexturePath('models/Baymax/');
			mtlLoader2.setPath('models/Baymax/');
			mtlLoader2.load('2.mtl', function(materials){
				materials.preload();
				
				loader3.setMaterials(materials);
				loader3.load(
				'models/2.obj', //Baymax
				function ( object ) {
					var mesh = object;
					mus.scene.add( mesh );
					mesh.scale.set(0.05,0.05,0.05);
					mesh.position.set(0, 0, 7);
					mesh.rotation.y = Math.PI;
					mus.objects.push(mesh);
				},
			);
			});
			
			var dummy;
			var mtlLoader3 = new THREE.MTLLoader();
			mtlLoader3.setTexturePath('models/dummy/');
			mtlLoader3.setPath('models/dummy/');
			mtlLoader3.load('3.mtl', function(materials){
				materials.preload();
				
				loader3.setMaterials(materials);
				loader3.load(
				'models/3.obj', //Dummy
				function ( object ) {
					var dummy = object;
					mus.scene.add( dummy );
					dummy.scale.set(0.015,0.015,0.015);
					dummy.position.set(7, 0, 7);
					dummy.rotation.y = Math.PI;
					mus.objects.push(dummy);
				},
			);
			});
			
			loader4.load(
				'models/4.obj', //Toilet
				function ( object ) {
					var mesh = object;
					mus.scene.add( mesh );
					mesh.scale.set(0.05,0.05,0.05);
					mesh.position.set(-7, 0, -7);
					mus.objects.push(mesh);
				},
			);
			loader5.load(
				'models/5.obj', //Tree
				function ( object ) {
					var mesh = object;
					mus.scene.add( mesh );
					mesh.scale.set(0.0005,0.0005,0.0005);
					mesh.position.set(0, 0, -7);
					mus.objects.push(mesh);
				},
			);
			loader6.load(
				'models/6.obj', //Lightbulb
				function ( object ) {
					var mesh = object;
					mus.scene.add( mesh );
					mesh.scale.set(0.2,0.2,0.2);
					mesh.position.set(7, 0, -7);
					mus.objects.push(mesh);
				},
			);
            

			
			///////Add Artworks~//////
			mus.artGroup = new THREE.Group();

			mus.num_of_paintings = 5;
			mus.paintings = [];
			for(var i = 0; i < mus.num_of_paintings; i++){
				(function(index) {
                    //https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
					var artwork = new Image();
					var ratiow = 0;
					var ratioh = 0;
					
					
					popup.push(document.getElementById("myPopup" + i));

					var source = './img/Artworks/' + (index).toString() + '.jpg';
					artwork.src = source;

                    var texture = THREE.ImageUtils.loadTexture(source);
                    texture.minFilter = THREE.LinearFilter;
					var img = new THREE.MeshBasicMaterial({ map: texture });

					artwork.onload = function(){
						ratiow = artwork.width/300;
						ratioh = artwork.height/300;
						// plane for artwork
						var plane = new THREE.Mesh(new THREE.PlaneGeometry(ratiow, ratioh),img); //width, height
						plane.overdraw = true;
                        //-1 because index is 0 - n-1 but num of paintings is n
						if(index <= Math.floor(mus.num_of_paintings/2)-1) //bottom half
						{
							//plane.rotation.z = Math.PI/2;
                            plane.position.set(index,2,-2.96); //y and z kept constant
						}
						else
						{
							//plane.rotation.z = Math.PI/2;
                            plane.position.set(2.5 * index - 55 ,2 ,2.96);
                            //plane.position.set(65*i - 75*Math.floor(mus.num_of_paintings/2) - 15*Math.floor(num_of_paintings/2), 48, 90);
							plane.rotation.y = Math.PI;
						}
						mus.scene.add(plane);
                        mus.paintings.push(plane);
					}
					//img.callback = function() { console.log( this.name ); }
					img.map.needsUpdate = true; //ADDED
					//img.callbacc = function() { console.log( this.name ); }
				}(i))
			}

			


		},
		render: function() {
			requestAnimationFrame(mus.render);

            ////Movement Controls /////
			if(mus.controls.enabled === true) {
                mus.initialRender = false;
				var currentTime = performance.now(); //returns time in milliseconds
				//accurate to the thousandth of a millisecond
				//want to get the most accurate and smallest change in time
				var delta = (currentTime-mus.prevTime)/1000;

				//there's a constant deceleration that needs to be applied
				//only when the object is currently in motion
				mus.moveVelocity.x -= mus.moveVelocity.x * 10.0 * delta;
				//for now
				mus.moveVelocity.y -= 9.8 * 7.0 * delta; // m/s^2 * kg * delta Time
				mus.moveVelocity.z -= mus.moveVelocity.z * 10.0 * delta;

				//need to apply velocity when keys are being pressed
				if(mus.moveForward) {
					mus.moveVelocity.z -= 38.0 * delta;
				}
				if(mus.moveBackward) {
					mus.moveVelocity.z += 38.0 * delta;
				}
				if(mus.moveLeft) {
					mus.moveVelocity.x -= 38.0 * delta;
				}
				if(mus.moveRight) {
					mus.moveVelocity.x += 38.0 * delta;
				}

				mus.controls.getObject().translateX(mus.moveVelocity.x * delta);
				mus.controls.getObject().translateY(mus.moveVelocity.y * delta);
				mus.controls.getObject().translateZ(mus.moveVelocity.z * delta);

				
				//Player boundaries/////
				if(mus.controls.getObject().position.y < 1.75) {
						mus.jump = true;
						mus.moveVelocity.y = 0;
						mus.controls.getObject().position.y = 1.75;
				}
                if(mus.controls.getObject().position.z < -9) {
                        mus.controls.getObject().position.z = -9;
                }
                if(mus.controls.getObject().position.z > 9) {
                        mus.controls.getObject().position.z = 9;
                }
                if(mus.controls.getObject().position.x < -9) {
                        mus.controls.getObject().position.x = -9;
                }
                if(mus.controls.getObject().position.x > 9) {
                        mus.controls.getObject().position.x = 9;
                }

                //rayCaster/////
                mus.raycaster.setFromCamera(mus.mouse.clone(), mus.camera);
                //calculate objects interesting ray
                mus.intersects = mus.raycaster.intersectObjects( mus.objects );
                if(mus.intersects.length !== 0) {
                    //mus.intersects.object.material.color.set(0xaaeeee);
                    //console.log(intersects[0].distance);
                    console.log("dummy");
					
					//popup[mus.intersects.length].classList.toggle("show");
					//---------------------------------------------------------------------------------------------------------------------------------------------------------
                }

                for(var i = 0; i < mus.wallGroup.children.length; i++) {

                    if(mus.user.BBox.isIntersectionBox(mus.wallGroup.children[i].BBox)){
                        mus.user.BBox.setFromObject(mus.user);
                    }
                    else {
                        mus.wallGroup.children[i].material.color.set(0xffffff);
                    }
                }
                mus.pastX = mus.controls.getObject().position.x;
                mus.pastZ = mus.controls.getObject().position.z;

                mus.user.BBox.setFromObject(mus.user);

				mus.prevTime = currentTime;

                mus.renderer.render(mus.scene, mus.camera);
			}
			else {
                    //reset delta time, so when unpausing, time elapsed during pause
                    //doesn't affect any variables dependent on time.
                    mus.prevTime = performance.now();
			}

            if(mus.initialRender === true) {
                for(var i = 0; i < mus.wallGroup.children.length; i++) {
                    mus.wallGroup.children[i].BBox.setFromObject(mus.wallGroup.children[i]);
                }
                mus.renderer.render(mus.scene, mus.camera);
            }
        }
	};

	mus.buildGui();
	mus.raycastSetUp();
	mus.boot();
	mus.pointerControls();
	mus.movement();
	mus.create();
	mus.click();
	mus.render();
