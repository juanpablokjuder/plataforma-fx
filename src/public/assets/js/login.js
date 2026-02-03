document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async function(e){
        e.preventDefault();
        const username = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if(!username || !password){
            Swal.fire('Error','Introduce usuario y contraseña','warning');
            return;
        }

        try {
            const res = await fetch('/api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const json = await res.json();
            if(json.ok){
                localStorage.setItem('fx_user', JSON.stringify(json.user));
                Swal.fire('OK','Inicio de sesión correcto','success').then(()=>{
                    window.location.href = '/dashboard.html';
                });
            } else {
                Swal.fire('Error', json.error || 'Credenciales inválidas', 'error');
            }
        } catch (err) {
            Swal.fire('Error','No se pudo conectar con el servidor','error');
            console.error(err);
        }
    });
});
