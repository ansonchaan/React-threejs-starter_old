import React, { useEffect, useRef } from 'react';
// import { useSelector } from 'react-redux';
import {CameraControlsSystem, initStats, initGUI, removeStats, removeGUI, getScreenSizeIn3dWorld , devMode } from './globalFuncFor3d';
import * as THREE from 'three';
import './home.scss';


const Home = props => {
    // const count = useSelector(state => state.count);
    const canvasWrap = useRef(null);


    useEffect(()=>{
        let scene = undefined,
            camera = undefined,
            dev = undefined,
            renderer = undefined,
            screen = { width: undefined, height: undefined };

        // light
        let ambientLight = undefined;
        let pointLight = undefined;

        // items array
        let geometryItems = [];
        let materialItems = [];
        let textureItems = [];
        let meshItems = [];

        // stats
        let stats = undefined;

        // options
        const options = {
            cameraZ:{ value:5, min:0, max:20, name:'Camera Z' },
            scale:{ value:10, min:0, max:50 }
        }

        // dragging system
        let dragging = null;
        
        const initEngine = () => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(30, window.innerWidth/window.innerHeight, 50, 1000);
            camera.position.set(0, 50, 150);


            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0xffffff, 0);
            canvasWrap.current.appendChild(renderer.domElement);
            

            stats = initStats();
            initGUI(options);
            initLight();
            initMesh();

            dragging = new CameraControlsSystem(camera);
            // console.log(dragging)
            dev = devMode(scene);
            
            renderer.setAnimationLoop(function() {
                update();
                render();
            });
        }

        const initLight = () => {
            ambientLight = new THREE.AmbientLight(0x999999);

            pointLight = new THREE.PointLight(0xffffff, 1, 100);
            pointLight.position.set(5, 4, 3);
            pointLight.add(new THREE.Mesh( new THREE.SphereGeometry(2,8,8), new THREE.MeshBasicMaterial({ color: 0xffffff })))

            scene.add(pointLight);
            scene.add(ambientLight);
        };
      
        const initMesh = () => {
            const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
            const geometry = new THREE.BoxGeometry(10,10,10);
            const mesh = new THREE.Mesh(geometry, material);
            
            materialItems.push(material);
            geometryItems.push(geometry);
            meshItems.push(mesh);

            for(let i=0; i< meshItems.length; i++)
                scene.add(meshItems[i]);
        };

        const draw = () => {
            pointLight.position.x = Math.cos(performance.now()/1000) * 20;
            pointLight.position.y = Math.sin(performance.now()/1000 *2) * 20;
            pointLight.position.z = Math.sin(performance.now()/1000) * 20;
        }
        
        const update = () => {
            draw();
            stats.update();
        };
  
        const render = () => {
            // renderer.render(scene, dev.godCamera);
            renderer.render(scene, camera);
        };

        const removeObjectIn3dWorld = () => {
            for(let i=0, lth=geometryItems.length; i<lth; i++){
                let geometry = geometryItems[i];
                geometry.dispose();
                if(i === lth-1)geometryItems = undefined;
            }
            for(let i=0, lth=materialItems.length; i<lth; i++){
                let material = materialItems[i];
                material.dispose();
                if(i === lth-1)materialItems = undefined;
            }
            for(let i=0, lth=textureItems.length; i<lth; i++){
                let texture = textureItems[i];
                texture.dispose();
                if(i === lth-1)textureItems = undefined;
            }
            for(let i=0, lth=meshItems.length; i<lth; i++){
                let mesh = meshItems[i];
                scene.remove(mesh);
                if(i === lth-1)meshItems = undefined;
            }
            scene.dispose();
        }

        
        const onWindowResize = () => {
            // camera.left = -window.innerWidth / 2;
            // camera.right = window.innerWidth / 2;
            // camera.top = window.innerHeight / 2;
            // camera.bottom = -window.innerHeight / 2;
            const screen = getScreenSizeIn3dWorld(camera);
            screen.width = screen.width;
            screen.height = screen.height;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        const initEvent = () => {
            addEvent();
        }

        const addEvent = () => {
            window.addEventListener("resize", onWindowResize);
        }

        const removeEvent = () => {
            if(dragging) dragging.destroy();
            if(dev) dev.destroy();
            window.removeEventListener("resize", onWindowResize);
        }

        initEngine();
        initEvent();

        return () => {
            removeStats();
            removeGUI();
            removeEvent();
            removeObjectIn3dWorld();
            renderer.setAnimationLoop(null);
        }
    },[])

    return (
        <div id="home">
            <div ref={canvasWrap} id="canvasWrap"></div>
        </div>
    )
}

export default Home;