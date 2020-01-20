import Stats from 'stats.js';
import * as dat from "dat.gui";
import * as THREE from 'three';

let stats = undefined;
let gui = undefined;

export const initStats = () => {
    stats = new Stats();
    stats.showPanel(0);
    stats.domElement.style.position = 'fixed';
    stats.domElement.style.top = 0;
    document.body.appendChild( stats.domElement );
  
    return stats;
}

export const removeStats = () => {
    stats.domElement.remove();
}

export const initGUI = (options) => {
    var arrayOptions = Object.entries(options);
    gui = new dat.GUI({width: 300});
    gui.domElement.parentNode.style.zIndex = 999;

    for(let i=0; i<arrayOptions.length; i++){
        var key = arrayOptions[i][0];
        if(typeof options[key] === 'function'){
            gui.add(options, key);
        }
        else{
            var name = arrayOptions[i][1].name || key.charAt(0).toUpperCase() + key.slice(1);
            var min = arrayOptions[i][1].min;
            var max = arrayOptions[i][1].max;
            gui.add(options[key], 'value').min(min).max(max).name(name);
        }
    }
}

export const removeGUI = () => {
    if(gui) gui.destroy();
}

export const getScreenSizeIn3dWorld = (camera) => {
    let w,h;
    const vFOV = THREE.Math.degToRad(camera.fov);
    
    // if (vFOV) {
        h = 2 * Math.tan(vFOV / 2) * camera.position.z;
        w = h * camera.aspect;
    // } else {
    //     w = window.innerWidth;
    //     h = window.innerHeight;
    // }
    return { width: w, height: h };
}

export const cameraPositionTo2dPosition = (camera) => {
    var p = new THREE.Vector3(camera.position.x, camera.position.y, 0);
    const vector = new THREE.Vector2();
    const screen = getScreenSizeIn3dWorld(camera);
    vector.x = p.x / screen.width / 2 * window.innerWidth / 2;
    vector.y = p.y / screen.height / 2 * window.innerHeight / 2;

    return vector;
}

// Conver 2d position to 3d position
export const convert2dto3d = (x, y, camera) => {
    var vector = new THREE.Vector3(x, y, 1);
    vector.unproject( camera );
    var dir = vector.sub( camera.position ).normalize();
    var distance = - camera.position.z / dir.z;
    return camera.position.clone().add( dir.multiplyScalar( distance ) );
}

export const CameraControlsSystem = (function(_super){
    function _CameraControlsSystem(camera){
        const _this = _super.call(this) || this;
        const mouse = {
            offset: new THREE.Vector2(),
            prevPos: new THREE.Vector2(),
            startPos: new THREE.Vector2(),
            lastPos: new THREE.Vector2(),
            delta: new THREE.Vector2(),
            button: {left:'rotate', right:'pan'},
            status: ''
        };
        _this.camera = camera;
        _this.yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(_this.camera.up, new THREE.Vector3(0, 1, 0));
        _this.spherical = new THREE.Spherical().setFromVector3(_this.camera.position.clone().applyQuaternion(_this.yAxisUpSpace));
        _this.sphericalEnd = _this.spherical.clone();
        _this.target = new THREE.Vector3();
        _this.targetEnd = _this.target.clone();
        //
        _this.easeTheta = _this.sphericalEnd.theta;
        _this.easePhi = _this.sphericalEnd.phi;
        _this.easeTarget = new THREE.Vector3();
        _this.rotationEase = .1;
        _this.translationEase = .1;
        _this.friction = .8;

        let _xColumn = new THREE.Vector3();
        let _yColumn = new THREE.Vector3();
        let _v3A = new THREE.Vector3();
        
        let looping = undefined;
        let clicked = false;

        const init = () => {
            onAnim();
            document.addEventListener('mousedown', onMouseDown, false);
            document.addEventListener('contextmenu', onContextMenu, false);
        }

        const rotate = (delta) => {
            const theta = _this.sphericalEnd.theta + Math.PI * 2 * delta.x / window.innerHeight;
            const phi = _this.sphericalEnd.phi + Math.PI * 2 * delta.y / window.innerHeight;
            
            this.rotateTo(theta, phi);

            console.log('rotate',theta, phi);
        }

        this.rotateTo = (theta, phi) => {
            _this.sphericalEnd.theta = theta;
            _this.sphericalEnd.phi = phi;
            _this.sphericalEnd.makeSafe();
        }

        const pan = (delta) => {
            const _camera = _this.camera;
            const offset = _v3A.copy(_camera.position).sub(_this.target);
            const fov = _camera.getEffectiveFOV() * THREE.Math.DEG2RAD;
            const targetDistance = offset.length() * Math.tan(fov * 0.5);
            const panSpeed = 2;
            const x = panSpeed * delta.x * targetDistance / window.innerHeight;
            const y = panSpeed * delta.y * targetDistance / window.innerHeight;

            this.panTo(x, y);

            console.log('pan',delta);
        }

        this.panTo = (x, y) => {
            _this.camera.updateMatrix();
            _xColumn.setFromMatrixColumn(_this.camera.matrix, 0);
            _yColumn.setFromMatrixColumn(_this.camera.matrix, 1);
            _xColumn.multiplyScalar(-x);
            _yColumn.multiplyScalar(y);

            const offset2 = _v3A.copy(_xColumn).add(_yColumn);
            _this.targetEnd.add(offset2);
            _this.target.copy(_this.targetEnd);
        }

        const update = () => {
            _this.easeTheta += (_this.sphericalEnd.theta - _this.easeTheta) * _this.rotationEase * _this.friction;
            _this.easePhi += (_this.sphericalEnd.phi - _this.easePhi) * _this.rotationEase * _this.friction;
            _this.spherical.theta = _this.easeTheta;
            _this.spherical.phi = _this.easePhi;

            _this.easeTarget.x += (_this.targetEnd.x - _this.easeTarget.x) * _this.translationEase * _this.friction;
            _this.easeTarget.y += (_this.targetEnd.y - _this.easeTarget.y) * _this.translationEase * _this.friction;
            _this.easeTarget.z += (_this.targetEnd.z - _this.easeTarget.z) * _this.translationEase * _this.friction;
            _this.target.copy(_this.easeTarget);

            // convert spherical to vector3
            // then add translation
            _this.camera.position.setFromSpherical(_this.spherical).add(_this.target);
            _this.camera.lookAt(_this.target);
            _this.camera.updateMatrixWorld();
        }

        const onAnim = () => {
            looping = requestAnimationFrame(onAnim);
            update();
        }

        const stopAnim = () => {
            if(looping){
                cancelAnimationFrame(looping);
                looping = undefined;
            }
        }

        const onMouseDown = (e) => {
            const mx = e.clientX;
            const my = e.clientY;
            mouse.startPos.set(mx, my);
            mouse.lastPos.set(mx, my);
                    
            clicked = true;
            switch( e.button ){
                case 0:
                    mouse.status = mouse.button.left;
                    break;
                    
                case 2:
                    mouse.status = mouse.button.right;
                    break;

                default:
                    break;
            }

            
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);

            // console.log('mousedown')
        }

        const onMouseMove = (e) => {
            if(clicked){
                const mx = e.clientX;
                const my = e.clientY;

                mouse.offset.set(mouse.startPos.x - mx, mouse.startPos.y - my);

                mouse.delta.set(-(mouse.lastPos.x - mx), -(mouse.lastPos.y - my));
                mouse.lastPos.set(mx,my);
                
                switch( mouse.status ){
                    case mouse.button.left:
                        rotate(mouse.delta);
                        break;
                        
                    case mouse.button.right:
                        pan(mouse.delta);
                        break;
        
                    default:
                        break;
                }


                console.log('mousemove')
            }
        }

        const onMouseUp = () => {
            clicked = false;
            // console.log('mouseup')
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
        }

        const onContextMenu = (e) => {
            e.preventDefault();
        }

        this.destroy = () => {
            document.removeEventListener('contextmenu', onContextMenu, false);
            document.removeEventListener('mousedown', onMouseDown, false);
            stopAnim();
        }

        init();
    }

    _CameraControlsSystem.prototype = Object.create( _super.prototype );
    _CameraControlsSystem.prototype.constructor = _CameraControlsSystem; // re-assign constructor
    // _CameraControlsSystem.prototype.panTo = function(){
    //     console.log(this,'pan to');
    // }

    return _CameraControlsSystem;
}(THREE.EventDispatcher));



export const devMode = (scene) => {
    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );

    const init = () => {
        document.addEventListener('keydown', onKeydown, false);
    }

    const onKeydown = (e) => {
        const key = e.keyCode;
        if(key === 87){
            scene.traverse((child) => {
                if(child.isMesh){
                    child.material.wireframe = !child.material.wireframe;
                }
            });
        }
    }
    
    const destroy = () => {
        document.removeEventListener('keydown', onKeydown, false);
    }

    init();

    return {
        destroy: destroy
    }
}