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
    const mouse = new THREE.Vector2().copy(vector);
    let clicked = false;
    let startMousePos = new THREE.Vector2();
    let oldMousePos = new THREE.Vector2().copy(vector);
    let radius = camera.position.z;
    let tempPos = new THREE.Vector3();
    let easePos = new THREE.Vector3();
    let useEase = true;

    const init = () => {
        setCameraPosition(vector);
        // easePos.copy(tempPos);
        // onAnim();
    }

    // rotate camera with 3d coordinate which is using mouse position
    const setCameraPosition = (vector) => {
        // if(useEase){
            // tempPos.x = radius * Math.sin(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180);
            // tempPos.y = radius * Math.sin(vector.y * Math.PI/180);
            // tempPos.z = radius * Math.cos(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180);

        // }
        // else{
            camera.position.x = radius * (Math.sin(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180));
            camera.position.y = radius * Math.sin(vector.y * Math.PI/180);
            camera.position.z = radius * Math.cos(vector.x * Math.PI/180) * Math.cos(vector.y * Math.PI/180);
        // }
        camera.updateMatrix();
    }

    // const update = () => {
    //     easePos.x += (tempPos.x - easePos.x) * .1;
    //     easePos.y += (tempPos.y - easePos.y) * .1;
    //     easePos.z += (tempPos.z - easePos.z) * .1;

    //     camera.position.x = easePos.x;
    //     camera.position.y = easePos.y;
    //     camera.position.z = easePos.z;

    //     camera.updateMatrix();
    // }

    // const onAnim = () => {
    //     requestAnimationFrame(onAnim);
    //     update();
    // }

    const onMouseDown = (e) => {
        clicked = true;
        startMousePos.set(e.clientX, e.clientY);

        console.log('mousedown')
    }

    const onMouseMove = (e) => {
        if(clicked){
            mouse.set(
                (startMousePos.x - e.clientX) + oldMousePos.x, 
                -(startMousePos.y - e.clientY) + oldMousePos.y
            );
            mouse.y = Math.min( 90, Math.max( -90, mouse.y));

            setCameraPosition(mouse);

            console.log('mousemove')
        }
    }

    const onMouseUp = (e) => {
        clicked = false;
        oldMousePos.copy(mouse);
        console.log('mouseup')
    }

    const enable = () => {
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    const disable = () => {
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    init();

    return {
        enable: enable,
        disable: disable
    }
}