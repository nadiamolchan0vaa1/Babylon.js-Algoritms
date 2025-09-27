window.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);

  const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // Камера
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 4,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);

    // Свет
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(1, 1, 0),
      scene
    );
    light.intensity = 0.9;

    // Оси координат
    const size = 5;

    const axisX = BABYLON.MeshBuilder.CreateLines(
      'axisX',
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0)],
      },
      scene
    );
    axisX.color = new BABYLON.Color3(1, 0, 0);

    const axisY = BABYLON.MeshBuilder.CreateLines(
      'axisY',
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0)],
      },
      scene
    );
    axisY.color = new BABYLON.Color3(0, 1, 0);

    const axisZ = BABYLON.MeshBuilder.CreateLines(
      'axisZ',
      {
        points: [BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size)],
      },
      scene
    );
    axisZ.color = new BABYLON.Color3(0, 0, 1);

    // Тестовый объект
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 1 },
      scene
    );
    sphere.position = new BABYLON.Vector3(2, 1, 0);

    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });
});
///////////////////////

