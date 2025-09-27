window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);

        // Камера
        const camera = new BABYLON.ArcRotateCamera(
            'camera', Math.PI / 4, Math.PI / 4, 10, BABYLON.Vector3.Zero(), scene
        );
        camera.attachControl(canvas, true);

        // Свет
        const light = new BABYLON.HemisphericLight(
            'light', new BABYLON.Vector3(1, 1, 0), scene
        );
        light.intensity = 0.9;

        // Оси координат
        const size = 5;
        BABYLON.MeshBuilder.CreateLines('axisX', {points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(size,0,0)]}, scene).color = new BABYLON.Color3(1,0,0);
        BABYLON.MeshBuilder.CreateLines('axisY', {points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0,size,0)]}, scene).color = new BABYLON.Color3(0,1,0);
        BABYLON.MeshBuilder.CreateLines('axisZ', {points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0,0,size)]}, scene).color = new BABYLON.Color3(0,0,1);

        // ----------------------------
        // Точки полигона
        const points2D = [
            {x:1, y:1},
            {x:3, y:2},
            {x:2, y:4},
            {x:0, y:3},
            {x:1.5, y:2.5}
        ];

        // Отобразим точки
        points2D.forEach((p,i) => {
            const sphere = BABYLON.MeshBuilder.CreateSphere(`point${i}`, {diameter:0.15}, scene);
            sphere.position = new BABYLON.Vector3(p.x,p.y,0);
            sphere.material = new BABYLON.StandardMaterial(`mat${i}`, scene);
            sphere.material.diffuseColor = new BABYLON.Color3(1,0,1);
        });

        // ----------------------------
        // Выпуклая оболочка (Graham Scan)
        function grahamScan(points) {
            if(points.length<3) return points.slice();
            const base = points.reduce((acc,p)=> (p.y<acc.y || (p.y===acc.y && p.x<acc.x))?p:acc );
            const sorted = points.slice().sort((a,b)=> Math.atan2(a.y-base.y,a.x-base.x)-Math.atan2(b.y-base.y,b.x-base.x));
            const stack = [];
            for(let p of sorted){
                while(stack.length>=2){
                    const q=stack[stack.length-1];
                    const r=stack[stack.length-2];
                    if((q.x-r.x)*(p.y-r.y)-(q.y-r.y)*(p.x-r.x)>0) break;
                    stack.pop();
                }
                stack.push(p);
            }
            return stack;
        }

        const hull = grahamScan(points2D);

        // Нарисуем выпуклую оболочку
        const hullPoints = hull.map(p=> new BABYLON.Vector3(p.x,p.y,0));
        hullPoints.push(hullPoints[0]); // замкнуть контур
        BABYLON.MeshBuilder.CreateLines("hull",{points:hullPoints},scene).color=new BABYLON.Color3(0,1,0);

        // ----------------------------
        // Простая триангуляция (Ear Clipping, для визуализации)
        function triangulate(polygon) {
            const triangles = [];
            const pts = polygon.slice();
            while(pts.length >= 3) {
                for(let i=0;i<pts.length;i++){
                    const prev = pts[(i+pts.length-1)%pts.length];
                    const curr = pts[i];
                    const next = pts[(i+1)%pts.length];

                    // Простая проверка: "ухо" не содержит другие точки
                    let isEar = true;
                    for(let p of pts){
                        if(p===prev || p===curr || p===next) continue;
                        if(pointInTriangle(p, prev, curr, next)){
                            isEar=false;
                            break;
                        }
                    }

                    if(isEar){
                        triangles.push([prev,curr,next]);
                        pts.splice(i,1);
                        break;
                    }
                }
            }
            return triangles;
        }

        function pointInTriangle(p, a, b, c){
            const areaOrig = Math.abs((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/2;
            const area1 = Math.abs((a.x-p.x)*(b.y-p.y)-(b.x-p.x)*(a.y-p.y))/2;
            const area2 = Math.abs((b.x-p.x)*(c.y-p.y)-(c.x-p.x)*(b.y-p.y))/2;
            const area3 = Math.abs((c.x-p.x)*(a.y-p.y)-(a.x-p.x)*(c.y-p.y))/2;
            return Math.abs(area1+area2+area3 - areaOrig)<1e-6;
        }

        const triangles = triangulate(points2D);

        // Нарисуем треугольники
        triangles.forEach((tri,i)=>{
            const pts = tri.map(p=> new BABYLON.Vector3(p.x,p.y,0));
            pts.push(pts[0]);
            BABYLON.MeshBuilder.CreateLines(`tri${i}`,{points:pts},scene).color=new BABYLON.Color3(0,0,1);
        });

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(()=>{scene.render();});
    window.addEventListener('resize',()=>{engine.resize();});
});
