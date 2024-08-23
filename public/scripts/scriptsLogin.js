// Проверяем авторизацию пользователя
fetch('/isLoggedIn', {
    method: 'GET',
    credentials: 'include' 
})
.then(response => {
    if (response.ok) {
        // Пользователь авторизован, отображаем кнопку
        document.getElementById('mapButton').style.display = 'block';
        document.getElementById('routesButton').style.display = 'block';
        document.getElementById('OurInfo').style.display = 'none';
        document.getElementById('ObrCall').style.display = 'none';
        document.getElementById('Contact-info').style.display = 'none';
        document.getElementById('SignInAdmin').style.display = 'none';
        document.getElementById('SignInAdmin1').style.display = 'none';
    } else {
        // Пользователь не авторизован, скрываем кнопку
        document.getElementById('mapButton').style.display = 'none';
        document.getElementById('routesButton').style.display = 'none';
        document.getElementById('SignInAdmin').style.display = 'block';
    }
})
.catch(error => {
    console.error('Ошибка проверки авторизации:', error);
    document.getElementById('mapButton').style.display = 'none';
    document.getElementById('routesButton').style.display = 'none';
    document.getElementById('OurInfo').style.display = 'block';
    document.getElementById('ObrCall').style.display = 'block';
    document.getElementById('Contact-info').style.display = 'block';
});