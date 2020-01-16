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

export const draggingSystem = (camera) => {
    const mouse = {
        offset: new THREE.Vector2(),
        prevPos: new THREE.Vector2(),
        startPos: new THREE.Vector2(),
        lastPos: new THREE.Vector2(),
        delta: new THREE.Vector2(),
        button: {left:'rotate', right:'pan'},
        status: ''
    };

    let yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
    let spherical = new THREE.Spherical().setFromVector3(camera.position.clone().applyQuaternion(yAxisUpSpace));
    let sphericalEnd = spherical.clone();
    let target = new THREE.Vector3();
    let targetEnd = target.clone();
    //
    let easeTheta = 0;
    let easePhi = 0;
    let easeTarget = new THREE.Vector3();
    let rotationEase = .3;
    let translationEase = .5;
    let friction = .8;

    let _xColumn = new THREE.Vector3();
    let _yColumn = new THREE.Vector3();
    let _v3A = new THREE.Vector3();
    
    let looping = undefined;
    let clicked = false;

    const init = () => {
        target.set(0,0,0);
        onAnim();
        
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('contextmenu', onContextMenu, false);
    }

    const rotate = (delta) => {
        const theta = sphericalEnd.theta + Math.PI * 2 * delta.x / window.innerHeight;
        const phi = sphericalEnd.phi + Math.PI * 2 * delta.y / window.innerHeight;
        
        sphericalEnd.theta = theta;
        sphericalEnd.phi = phi;
        sphericalEnd.makeSafe();

        console.log('rotate',spherical.theta,Math.PI * 2 * delta.x);
    }

    const pan = (delta) => {
        const _camera = camera;
        const offset = _v3A.copy(_camera.position).sub(target);
        const fov = _camera.getEffectiveFOV() * THREE.Math.DEG2RAD;
        const targetDistance = offset.length() * Math.tan(fov * 0.5);
        const panSpeed = 2;
        const x = panSpeed * delta.x * targetDistance / window.innerHeight;
        const y = panSpeed * delta.y * targetDistance / window.innerHeight;

        camera.updateMatrix();
        _xColumn.setFromMatrixColumn(camera.matrix, 0);
        _yColumn.setFromMatrixColumn(camera.matrix, 1);
        _xColumn.multiplyScalar(-x);
        _yColumn.multiplyScalar(y);

        const offset2 = _v3A.copy(_xColumn).add(_yColumn);
        targetEnd.add(offset2);
        target.copy(targetEnd);

        console.log('pan',fov);
    }

    const update = () => {
        easeTheta += (sphericalEnd.theta - easeTheta) * rotationEase * friction;
        easePhi += (sphericalEnd.phi - easePhi) * rotationEase * friction;
        spherical.theta = easeTheta;
        spherical.phi = easePhi;

        easeTarget.x += (targetEnd.x - easeTarget.x) * translationEase * friction;
        easeTarget.y += (targetEnd.y - easeTarget.y) * translationEase * friction;
        easeTarget.z += (targetEnd.z - easeTarget.z) * translationEase * friction;
        target.copy(easeTarget);

        // convert spherical to vector3
        // then add translation
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
        camera.updateMatrixWorld();
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

    const destroy = () => {
        document.removeEventListener('contextmenu', onContextMenu, false);
        document.removeEventListener('mousedown', onMouseDown, false);
        stopAnim();
    }

    init();

    return {
        destroy: destroy
    }
}

export const devMode = (scene) => {
    const axesHelper = new THREE.AxesHelper( 50 );
    scene.add( axesHelper );
    
    const destroy = () => {

    }

    return {
        destroy: destroy
    }
}