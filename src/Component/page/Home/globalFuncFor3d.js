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

const cameraPositionTo2dPosition = (camera) => {
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

export const draggingSystem = (camera) => {
    // get current camera position then convert to 2d coordinate
    const vector = cameraPositionTo2dPosition(camera);
    const mouse = {
        offset: new THREE.Vector2(),
        prevPos: new THREE.Vector2(),
        startPos: new THREE.Vector2(),
        currentPos: new THREE.Vector2().copy(vector),
        lastPos: new THREE.Vector2(),
        delta: new THREE.Vector2(),
        button: {left:'rotate', right:'pan'},
        status: ''
    };
    let easeMouse = new THREE.Vector2();
    let radius = camera.position.z;
    let looping = undefined;
    let clicked = false;
    let target = new THREE.Vector3();
    let panOffset = new THREE.Vector2();
    //
    let ease = .1;
    let friction = .8;
    let intensity = 1;

    let transformation = new THREE.Matrix4();
    let rotation = new THREE.Matrix4();
    let translation = new THREE.Matrix4();

    let theta = 0;
    let phi = 0;

    const init = () => {
        onAnim();
    }


    // rotate camera with 3d coordinate which is using mouse position
    const setCameraPosition = (vector) => {
        camera.position.x = radius * (Math.sin(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180));
        camera.position.y = radius * Math.sin(vector.y * Math.PI/180);
        camera.position.z = radius * Math.cos(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180);

        target.set(0,0,0);
        camera.lookAt(target);

        // switch( mouse.status ){
        //     case mouse.button.left:
                
        //         break;

        //     case mouse.button.right:
        //         break;

        //     default:
        //         break;
        // }
            // rotation.makeRotationY( (Math.sin(vector.x*.1 * Math.PI/180) * Math.cos(vector.y*.1 * Math.PI/180)) );
            // transformation.multiply(rotation);
            // rotation.makeRotationX( Math.sin(vector.y*.1 * Math.PI/180) );
            // camera.matrixAutoUpdate = false;
            // rotation.makeRotationZ( (Math.cos(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180)) );
            // translation.makeTranslation(panOffset.x,panOffset.y,0);

            // transformation.multiply(rotation);
            // camera.updateMatrix();
            // camera.applyMatrix(translation);

            // camera.lookAt(target);
        // }
        // else{
            // var xAxis = new THREE.Vector3(
            //     camera.matrixWorld.elements[0], 
            //     camera.matrixWorld.elements[1], 
            //     camera.matrixWorld.elements[2]);
            // var yAxis = new THREE.Vector3(
            //     camera.matrixWorld.elements[4], 
            //     camera.matrixWorld.elements[5], 
            //     camera.matrixWorld.elements[6]);

            // camera.position.addScaledVector(xAxis, panOffset.x*.01);
            // camera.position.addScaledVector(yAxis, panOffset.y*.01);
        // }
        camera.updateMatrix();
        camera.updateMatrixWorld();
    }

    const setRotate = (delta) => {
        // const deltaPhi = 1 * delta.x;
	    // const deltaTheta = 1 * delta.y;
        // const pos = camera.position.sub(target);
        // const radius = pos.length();
        // theta = Math.acos(pos.z / radius);
        // phi = Math.atan2(pos.y, pos.x);
        
        // theta = Math.min(Math.max(theta - deltaTheta, 0), Math.PI);
        // phi -= deltaPhi;
        
        console.log('rotate');
        // mouse.currentPos.y = Math.min( 90, Math.max( -90, mouse.currentPos.y));
    }

    const setPan = () => {
        console.log('pan');
    }

    const update = () => {
        // easing
        easeMouse.x += (mouse.currentPos.x - easeMouse.x) * ease * friction;
        easeMouse.y += (mouse.currentPos.y - easeMouse.y) * ease * friction;
        setCameraPosition(easeMouse);
    }

    const onAnim = () => {
        looping = requestAnimationFrame(onAnim);
        update(vector);
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
                
        clicked = true;
        switch( e.button ){
            case 0:
                mouse.status = mouse.button.left;
                break;
                
            case 2:
                mouse.status = mouse.button.right;
                mouse.lastPos.set(mx,my);
                break;

            default:
                break;
        }

        // console.log('mousedown')
    }

    const onMouseMove = (e) => {
        if(clicked){
            const mx = e.clientX;
            const my = e.clientY;

            mouse.offset.set(mx - mouse.startPos.x, -(my - mouse.startPos.y));
            mouse.delta.set(mx - mouse.lastPos.x, -(my - mouse.lastPos.y));
            
            mouse.currentPos.set(
                mouse.offset.x + mouse.prevPos.x * intensity,// + oldMousePos.x, 
                mouse.offset.y + mouse.prevPos.y * intensity// + oldMousePos.y
            );

            switch( mouse.status ){
                case mouse.button.left:
                    setRotate(mouse.delta);
                    break;
                    
                case mouse.button.right:
                    setPan();
                    break;
    
                default:
                    break;
            }

            mouse.lastPos.set(mx,my);

            console.log('mousemove')
        }
    }

    const onMouseUp = () => {
        clicked = false;
        mouse.prevPos.copy(mouse.currentPos);
        mouse.delta.set(0,0);
        // prevRotateVector.copy(mousePos);
        // prevPanVector.copy(mousePos);

        // console.log('mouseup')
    }

    const onContextMenu = (e) => {
        e.preventDefault();
    }

    const enable = () => {
        document.addEventListener('contextmenu', onContextMenu, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        init();
    }

    const disable = () => {
        document.removeEventListener('contextmenu', onContextMenu, false);
        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        stopAnim();
    }

    return {
        enable: enable,
        disable: disable
    }
}

export const devMode = (camera, scene) => {
    const cameraHelper = new THREE.CameraHelper(camera);
    scene.add(cameraHelper);

    const godCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    godCamera.position.set(250, 100, 400);
    godCamera.lookAt(0,0,0);
    scene.add(godCamera);

    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );

    return {
        cameraHelper, 
        godCamera
    };
}