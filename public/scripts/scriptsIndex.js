const texts = [
  `<h1>История создания проекта</h1>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
      Sed vitae eros eu risus gravida scelerisque nec vitae justo. Donec ut velit quis sem laoreet dictum. 
      Aenean eget lorem ut lorem laoreet tristique. Donec ut lorem id turpis fermentum porttitor. 
      Maecenas eget est in lorem dictum tristique non at turpis. Nullam eget massa et sapien condimentum mattis. 
      Maecenas vel urna a magna ultricies viverra. Integer sed ex at lorem suscipit bibendum. Maecenas ut leo vel turpis blandit lacinia sit amet id quam.</p>`,

  `<h2>Ключевые этапы разработки</h2>
  <ul>
      <li>Идея проекта и формирование концепции</li>
      <li>Разработка дизайна и интерфейса</li>
      <li>Создание бэкэнда и интеграция с базой данных</li>
      <li>Тестирование и оптимизация</li>
      <li>Запуск и дальнейшее развитие</li>
  </ul>`,

  `<h2>Команда проекта</h2>
  <p>Проект разработан командой талантливых специалистов, которые внесли свой вклад в его успех.</p>`,

  `<h2>Наши цели</h2>
  <ul>
      <li>Улучшение системы сбора мусора в городе</li>
      <li>Снижение затрат на вывоз мусора</li>
      <li>Повышение уровня экологической безопасности</li>
  </ul>`
  ];
  
  let currentTextIndex = 0;
  const textElement = document.querySelector(".fading-text");

  function changeText() {
  textElement.innerHTML = texts[currentTextIndex];
  currentTextIndex = (currentTextIndex + 1) % texts.length;
  }

  changeText();
  setInterval(changeText, 5000);