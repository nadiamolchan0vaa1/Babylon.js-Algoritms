window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas'); // убедись, что canvas есть на visual.html
    const engine = new BABYLON.Engine(canvas, true);

    const points2D = [];
    const spheres = [];
    let hullLine = null;
    let triangleLines = [];

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);

        const camera = new BABYLON.ArcRotateCamera('camera', Math.PI/4, Math.PI/4, 10, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1,1,0), scene);
        light.intensity = 0.9;

        // Оси
        const size=5;
        BABYLON.MeshBuilder.CreateLines('axisX',{points:[BABYLON.Vector3.Zero(), new BABYLON.Vector3(size,0,0)]},scene).color=new BABYLON.Color3(1,0,0);
        BABYLON.MeshBuilder.CreateLines('axisY',{points:[BABYLON.Vector3.Zero(), new BABYLON.Vector3(0,size,0)]},scene).color=new BABYLON.Color3(0,1,0);
        BABYLON.MeshBuilder.CreateLines('axisZ',{points:[BABYLON.Vector3.Zero(), new BABYLON.Vector3(0,0,size)]},scene).color=new BABYLON.Color3(0,0,1);

        // Динамически создаём панель ввода координат
        const controlDiv = document.createElement('div');
        controlDiv.style.position='absolute';
        controlDiv.style.top='10px';
        controlDiv.style.left='10px';
        controlDiv.style.background='rgba(255,255,255,0.8)';
        controlDiv.style.padding='10px';
        controlDiv.style.borderRadius='5px';
        controlDiv.style.zIndex='100';

        const xInput = document.createElement('input');
        xInput.placeholder='X';
        xInput.type='number';
        xInput.step='0.1';
        const yInput = document.createElement('input');
        yInput.placeholder='Y';
        yInput.type='number';
        yInput.step='0.1';

        const addBtn = document.createElement('button');
        addBtn.innerText='Добавить точку';
        controlDiv.appendChild(xInput);
        controlDiv.appendChild(yInput);
        controlDiv.appendChild(addBtn);
        document.body.appendChild(controlDiv);

        // ----------------------------
        // Graham Scan
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

        function pointInTriangle(p,a,b,c){
            const areaOrig = Math.abs((b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y))/2;
            const area1 = Math.abs((a.x-p.x)*(b.y-p.y)-(b.x-p.x)*(a.y-p.y))/2;
            const area2 = Math.abs((b.x-p.x)*(c.y-p.y)-(c.x-p.x)*(b.y-p.y))/2;
            const area3 = Math.abs((c.x-p.x)*(a.y-p.y)-(a.x-p.x)*(c.y-p.y))/2;
            return Math.abs(area1+area2+area3 - areaOrig)<1e-6;
        }

        function triangulate(polygon){
            const triangles=[];
            const pts=polygon.slice();
            while(pts.length>=3){
                for(let i=0;i<pts.length;i++){
                    const prev=pts[(i+pts.length-1)%pts.length];
                    const curr=pts[i];
                    const next=pts[(i+1)%pts.length];
                    let isEar=true;
                    for(let p of pts){
                        if(p===prev || p===curr || p===next) continue;
                        if(pointInTriangle(p,prev,curr,next)){
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

        // ----------------------------
        function updateVisualization(){
            if(hullLine) hullLine.dispose();
            triangleLines.forEach(l=>l.dispose());
            triangleLines=[];

            const hull = grahamScan(points2D);
            const hullPoints = hull.map(p=>new BABYLON.Vector3(p.x,p.y,0));
            if(hullPoints.length>0) hullPoints.push(hullPoints[0]);
            hullLine = BABYLON.MeshBuilder.CreateLines("hull",{points:hullPoints},scene);
            hullLine.color=new BABYLON.Color3(0,1,0);

            const triangles = triangulate(points2D);
            triangles.forEach((tri,i)=>{
                const pts = tri.map(p=>new BABYLON.Vector3(p.x,p.y,0));
                pts.push(pts[0]);
                const l = BABYLON.MeshBuilder.CreateLines(`tri${i}`,{points:pts},scene);
                l.color=new BABYLON.Color3(0,0,1);
                triangleLines.push(l);
            });
        }

        addBtn.addEventListener('click',()=>{
            const x=parseFloat(xInput.value);
            const y=parseFloat(yInput.value);
            if(!isNaN(x) && !isNaN(y)){
                points2D.push({x,y});
                const sphere = BABYLON.MeshBuilder.CreateSphere(`point${points2D.length}`,{diameter:0.15},scene);
                sphere.position = new BABYLON.Vector3(x,y,0);
                const mat = new BABYLON.StandardMaterial(`mat${points2D.length}`,scene);
                mat.diffuseColor = new BABYLON.Color3(1,0,1);
                sphere.material=mat;
                spheres.push(sphere);
                updateVisualization();
            }
        });

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(()=>scene.render());
    window.addEventListener('resize',()=>engine.resize());
});
