 // Функционал сплиттера
      const splitHandle = document.getElementById('splitHandle');
      const leftPanel = document.querySelector('.left-panel');
      const rightPanel = document.querySelector('.right-panel');
      const splitContainer = document.querySelector('.split-container');
      
      // Добавленные элементы управления
      const modeStatus = document.getElementById('modeStatus');
      const resetBtn = document.getElementById('resetBtn');
      const switchModeBtn = document.getElementById('switchModeBtn');
      const pointA = document.getElementById('pointA');
      const pointB = document.getElementById('pointB');
      const pointC = document.getElementById('pointC');
      
      let isResizing = false;
      
      splitHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
      });
      
      function handleMouseMove(e) {
        if (!isResizing) return;
        
        const containerRect = splitContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const handleWidth = splitHandle.offsetWidth;
        
        // Вычисляем новую ширину левой панели
        let newLeftWidth = ((e.clientX - containerRect.left) / containerWidth) * 100;
        
        // Ограничиваем минимальную ширину панелей
        newLeftWidth = Math.max(20, Math.min(80, newLeftWidth));
        
        // Устанавливаем новую ширину
        leftPanel.style.flex = `0 0 ${newLeftWidth}%`;
        rightPanel.style.flex = `0 0 ${100 - newLeftWidth - (handleWidth / containerWidth * 100)}%`;
        
        // Перерисовываем Babylon.js сцену при изменении размера
        engine.resize();
      }
      
      function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResize);
      }