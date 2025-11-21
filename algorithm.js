 // Babylon.js код
      const canvas = document.getElementById("renderCanvas");
      const engine = new BABYLON.Engine(canvas, true);
      const scene = new BABYLON.Scene(engine);
      
      // Камера сверху на плоскость XY
      const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -20), scene);
      camera.setTarget(BABYLON.Vector3.Zero());

      // Размер сетки
      const size = 20;
      const step = 1;
      const lines = [];

      // Вертикальные линии
      for (let x = -size; x <= size; x += step) {
        lines.push([
          new BABYLON.Vector3(x, -size, 0),
          new BABYLON.Vector3(x, size, 0)
        ]);
      }

      // Горизонтальные линии
      for (let y = -size; y <= size; y += step) {
        lines.push([
          new BABYLON.Vector3(-size, y, 0),
          new BABYLON.Vector3(size, y, 0)
        ]);
      }

      // Сетка
      const grid = BABYLON.MeshBuilder.CreateLineSystem("grid", { lines }, scene);
      grid.color = new BABYLON.Color3(0.5, 0.5, 0.5);

      // Оси координат (цветные линии)

      //X
      const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
        points: [new BABYLON.Vector3(-size, 0, 0), new BABYLON.Vector3(size, 0, 0)]
      }, scene);
      axisX.color = new BABYLON.Color3(1, 0, 0); // X — красный

      // Стрелка для оси X
      const arrowX = BABYLON.MeshBuilder.CreateCylinder("arrowX", {
          height: 0.5,
          diameterTop: 0,
          diameterBottom: 0.3
      }, scene);
      arrowX.position = new BABYLON.Vector3(13, 0, 0);
      arrowX.rotation.z = Math.PI+Math.PI/2 ; // Поворачиваем вдоль оси X
      
      const arrowXMat = new BABYLON.StandardMaterial("arrowXMat", scene);
      arrowXMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
      arrowX.material = arrowXMat;

      //Y
      const axisY = BABYLON.MeshBuilder.CreateLines("axisY", {
        points: [new BABYLON.Vector3(0, -size, 0), new BABYLON.Vector3(0, size, 0)]
      }, scene);
      axisY.color = new BABYLON.Color3(0, 1, 0); // Y — зелёный

      // Стрелка для оси Y
      const arrowY = BABYLON.MeshBuilder.CreateCylinder("arrowY", {
          height: 0.5,
          diameterTop: 0,
          diameterBottom: 0.3
      }, scene);
      arrowY.position = new BABYLON.Vector3(0, 8.25, 0);
      //arrowX.rotation.z = Math.PI+Math.PI/2 ; // Поворачиваем вдоль оси X

      const arrowYMat = new BABYLON.StandardMaterial("arrowYMat", scene);
      arrowYMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
      arrowY.material = arrowYMat;
      
      // Переменные для управления режимами (добавлено)
      let isBuildingMode = true;
      let userTrianglePoints = [];
      let userTriangleMesh = null;
      let userPointMeshes = [];
      let userLabelMeshes = [];

      // Функция создания точки (немного изменена для переиспользования)
      const createPoint = (pos, color, size = 0.3) => {
        const sphere = BABYLON.MeshBuilder.CreateSphere("point", {diameter: size}, scene);
        sphere.position = pos;
        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.emissiveColor = color;
        sphere.material = mat;
        return sphere;
      };

      // Функция создания GUI метки (добавлено)
      function createGUILabel(position, text) {
        const plane = BABYLON.MeshBuilder.CreatePlane("label_" + text, { 
          width: 20, 
          height: 20 
        }, scene);
        plane.position = new BABYLON.Vector3(position.x, position.y + 0.5, 0);

        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);

        const rect = new BABYLON.GUI.Rectangle();
        rect.width = "35px";
        rect.height = "35px";
        rect.cornerRadius = 5;
        rect.color = "Orange";
        rect.thickness = 3;
        rect.background = "black";
        advancedTexture.addControl(rect);

        const label = new BABYLON.GUI.TextBlock();
        label.text = text;
        label.color = "white";
        label.fontSize = 20;
        rect.addControl(label);

        return plane;
      }

      // Функция построения треугольника пользователем (добавлено)
      function buildUserTriangle() {
        if (userTriangleMesh) {
          userTriangleMesh.dispose();
        }
        
        const trianglePoints = [
          ...userTrianglePoints,
          userTrianglePoints[0] // Замыкаем треугольник
        ];
        
        userTriangleMesh = BABYLON.MeshBuilder.CreateLines("userTriangle", { 
          points: trianglePoints 
        }, scene);
        userTriangleMesh.color = new BABYLON.Color3(0, 1, 1);
      }

      // Функция сброса пользовательского треугольника (добавлено)
      function resetUserTriangle() {
        userTrianglePoints = [];
        
        userPointMeshes.forEach(mesh => mesh.dispose());
        userLabelMeshes.forEach(mesh => mesh.dispose());
        userPointMeshes = [];
        userLabelMeshes = [];
        
        if (userTriangleMesh) {
          userTriangleMesh.dispose();
          userTriangleMesh = null;
        }
        
        modeStatus.textContent = "Построение треугольника (0/3 точек)";
        resetBtn.style.display = 'none';
        switchModeBtn.style.display = 'none';
        
        pointA.textContent = "(1, 3)";
        pointB.textContent = "(3, 3)";
        pointC.textContent = "(2, 1)";
      }

      // Функция переключения в режим проверки (добавлено)
      function switchToTestingMode() {
        isBuildingMode = false;
        modeStatus.textContent = "Режим проверки точек";
        resetBtn.style.display = 'inline-block';
        switchModeBtn.textContent = 'Построить новый треугольник';
        
        // Обновляем координаты в левой панели
        pointA.textContent = `(${userTrianglePoints[0].x.toFixed(1)}, ${userTrianglePoints[0].y.toFixed(1)})`;
        pointB.textContent = `(${userTrianglePoints[1].x.toFixed(1)}, ${userTrianglePoints[1].y.toFixed(1)})`;
        pointC.textContent = `(${userTrianglePoints[2].x.toFixed(1)}, ${userTrianglePoints[2].y.toFixed(1)})`;
      }

      

      

      // Создаем невидимую плоскость на всю сцену
      const invisiblePlane = BABYLON.MeshBuilder.CreatePlane("invisiblePlane", {
      width: 20,
      height: 20
      }, scene);

      const invisibleMaterial = new BABYLON.StandardMaterial("invisibleMat", scene);
      invisibleMaterial.alpha = 0;
      invisiblePlane.material = invisibleMaterial;

      // Алгоритм проверки точки в треугольнике
      function isPointInTriangle(P, A, B, C) {
        const v0 = {x: C.x - A.x, y: C.y - A.y};
        const v1 = {x: B.x - A.x, y: B.y - A.y};
        const v2 = {x: P.x - A.x, y: P.y - A.y};

        const d00 = v0.x*v0.x + v0.y*v0.y;
        const d01 = v0.x*v1.x + v0.y*v1.y;
        const d11 = v1.x*v1.x + v1.y*v1.y;
        const d20 = v2.x*v0.x + v2.y*v0.y;
        const d21 = v2.x*v1.x + v2.y*v1.y;

        const denom = d00*d11 - d01*d01;
        const v = (d11*d20 - d01*d21)/denom;
        const w = (d00*d21 - d01*d20)/denom;
        const u = 1 - v - w;

        return (u >= 0) && (v >= 0) && (w >= 0);
      }

      // Обработчики кнопок (добавлено)
      resetBtn.addEventListener('click', resetUserTriangle);
      switchModeBtn.addEventListener('click', function() {
        if (isBuildingMode && userTrianglePoints.length === 3) {
          switchToTestingMode();
        } else {
          resetUserTriangle();
          isBuildingMode = true;
          modeStatus.textContent = "Построение треугольника (0/3 точек)";
          switchModeBtn.style.display = 'none';
        }
      });

      // Обработка клика (модифицирована)
      scene.onPointerDown = (evt, pickInfo) => {
        const pick = scene.pick(scene.pointerX, scene.pointerY);
        if (pick && pick.hit) {
          if (isBuildingMode) {
            // Режим построения треугольника
            if (userTrianglePoints.length < 3) {
              userTrianglePoints.push(pick.pickedPoint.clone());
              
              const pointMesh = createPoint(pick.pickedPoint, new BABYLON.Color3(1,0.647,0), 0.3);
              userPointMeshes.push(pointMesh);
              
              const labelText = ["A", "B", "C"][userTrianglePoints.length - 1];
              const labelMesh = createGUILabel(pick.pickedPoint, labelText);
              userLabelMeshes.push(labelMesh);
              
              modeStatus.textContent = `Построение треугольника (${userTrianglePoints.length}/3 точек)`;
              resetBtn.style.display = 'inline-block';
              
              if (userTrianglePoints.length === 3) {
                buildUserTriangle();
                switchModeBtn.style.display = 'inline-block';
              }
            }
          } else {
            // Режим проверки точек
            const A = {x: userTrianglePoints[0].x, y: userTrianglePoints[0].y};
            const B = {x: userTrianglePoints[1].x, y: userTrianglePoints[1].y};
            const C = {x: userTrianglePoints[2].x, y: userTrianglePoints[2].y};
            
            if(isPointInTriangle(pick.pickedPoint, A, B, C)) {
              createPoint(pick.pickedPoint, new BABYLON.Color3(0,1,0), 0.175);
            } else {
              createPoint(pick.pickedPoint, new BABYLON.Color3(1,1,0), 0.175);
            }
          }
        }
      };

      // Рендеринг сцены
      engine.runRenderLoop(() => scene.render());
      window.addEventListener("resize", () => engine.resize());