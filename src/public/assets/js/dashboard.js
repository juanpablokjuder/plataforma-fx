const INSTRUMENTS = ['EURUSD','USDJPY','GBPUSD','AUDUSD','USDCAD'];
let priceMap = {};
let qtyMap = {};

function renderRow(sym){
    return `<tr data-symbol="${sym}">
        <td>${sym}</td>
        <td class="price">-</td>
        <td class="qty">-</td>
        <td><input class="target" type="number" step="1" placeholder="Precio" /></td>
        <td><input class="cqty" type="number" step="1" placeholder="Cantidad" /></td>
        <td>
            <select class="side">
                <option value="buy">Comprar</option>
                <option value="sell">Vender</option>
            </select>
        </td>
    </tr>`;
}

document.addEventListener('DOMContentLoaded', function(){
    const user = JSON.parse(localStorage.getItem('fx_user') || 'null');
    if(!user){
        window.location.href = '/';
        return;
    }
    const usernameEl = document.getElementById('usernameDisplay');
    if(usernameEl) usernameEl.textContent = user.username;

    // Logout button: termina la sesión del usuario (frontend + backend)
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', async function(){
            try {
                // Intentar notificar al backend (por si se usan sesiones PHP)
                await fetch('/api/logout.php', { method: 'POST' });
            } catch(e) {
                // ignore
            }
            localStorage.removeItem('fx_user');
            window.location.href = '/';
        });
    }

    const tbody = document.querySelector('#instruments tbody');
    INSTRUMENTS.forEach(s=> tbody.insertAdjacentHTML('beforeend', renderRow(s)));

    const table = $('#instruments').DataTable({ paging: false, searching: false, info: false });

    // Try WebSocket connection (optional). If absent, we fallback to AJAX polling.
    let ws = null;
    try{
        const wsHost = location.hostname || 'localhost';
        ws = new WebSocket('ws://' + wsHost + ':8081');
        ws.addEventListener('open', ()=>{
            // If polling was running, stop it to avoid duplicate updates
            if(typeof pollTimer !== 'undefined' && pollTimer){
                clearInterval(pollTimer);
                pollTimer = null;
            }
            Swal.fire({ icon: 'info', title: 'WebSocket', text: 'Conectado al servidor de datos' });
        });
        ws.addEventListener('message', (ev)=>{ try { handleServerMessage(ev.data); } catch(e){ console.error(e); } });
        ws.addEventListener('close', ()=>{ Swal.fire('Desconectado','Se perdió la conexión WebSocket','error'); startPolling(); });
        ws.addEventListener('error', ()=>{ startPolling(); });
    } catch(e){
        startPolling();
    }

    document.getElementById('sendAll').addEventListener('click', ()=>{
        const rows = Array.from(document.querySelectorAll('#instruments tbody tr'));
        const params = [];
        const invalid = [];

        // Clear previous invalid styles
        rows.forEach(r => {
            const ti = r.querySelector('.target');
            const qi = r.querySelector('.cqty');
            if(ti) ti.classList.remove('invalid');
            if(qi) qi.classList.remove('invalid');
        });

        rows.forEach(r => {
            const symbol = r.dataset.symbol;
            const targetInput = r.querySelector('.target');
            const cqtyInput = r.querySelector('.cqty');
            const side = r.querySelector('.side').value;

            const targetRaw = targetInput.value.trim();
            const cqtyRaw = cqtyInput.value.trim();

            // If both empty, skip this row (no config to send)
            if(targetRaw === '' && cqtyRaw === '') return;

            const target = targetRaw === '' ? null : parseFloat(targetRaw);
            const cqty = cqtyRaw === '' ? null : parseInt(cqtyRaw, 10);

            let rowErrors = [];
            if(target === null || isNaN(target) || target <= 0){
                rowErrors.push('invalid_target');
                targetInput.classList.add('invalid');
            }
            if(cqty === null || isNaN(cqty) || cqty <= 0){
                rowErrors.push('invalid_quantity');
                cqtyInput.classList.add('invalid');
            }

            if(rowErrors.length){
                invalid.push({ symbol, reasons: rowErrors });
                return;
            }

            params.push({ symbol, target, cqty, side, marketPrice: priceMap[symbol] || null });
        });

        if(invalid.length){
            const rowsHtml = invalid.map(it => {
                const msgs = it.reasons.map(r => r === 'invalid_target' ? 'Precio debe ser numérico y mayor a 0' : 'Cantidad debe ser entera y mayor a 0');
                return `<b>${it.symbol}</b>: ${msgs.join(', ')}`;
            }).join('<br/>');
            Swal.fire({ icon: 'error', title: 'Errores en las filas', html: 'Corrige los siguientes errores por fila:<br/><br/>' + rowsHtml });
            return;
        }

        if(params.length === 0){
            Swal.fire('Atención','No hay configuraciones para enviar','info');
            return;
        }

        const payload = { user: user.username, ts: Date.now(), params };
        if(ws && ws.readyState === WebSocket.OPEN){
            ws.send(JSON.stringify(payload));
            Swal.fire('Enviando','Se han enviado las configuraciones al servidor','info');
            return;
        }

        // Fallback: POST to API
        fetch('/api/send_params.php', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        }).then(r => r.json()).then(j => {
            if(j.status === 'ok'){
                Swal.fire('Enviado','Servidor confirmó recepción: ' + (j.receivedFor || []).join(', '),'success');
            } else if(j.status === 'error'){
                // Highlight server-reported invalids if present
                if(Array.isArray(j.invalid)){
                    j.invalid.forEach(it => {
                        const row = document.querySelector(`#instruments tbody tr[data-symbol="${it.symbol}"]`);
                        if(row){
                            const ti = row.querySelector('.target');
                            const qi = row.querySelector('.cqty');
                            if(it.reason === 'invalid_target') ti && ti.classList.add('invalid');
                            if(it.reason === 'invalid_quantity') qi && qi.classList.add('invalid');
                        }
                    });
                }

                let title = 'Parámetros inválidos';
                let html = 'Algunos parámetros no cumplen las validaciones.';
                if(Array.isArray(j.invalid) && j.invalid.length){
                    const rows = j.invalid.map(it => {
                        const sym = it.symbol || 'sin símbolo';
                        const reason = it.reason || 'invalid';
                        let human = reason;
                        if(reason === 'invalid_target') human = 'Precio debe ser numérico y mayor a 0';
                        if(reason === 'invalid_quantity') human = 'Cantidad debe ser entera y mayor a 0';
                        if(reason === 'missing_symbol') human = 'Falta símbolo';
                        return `<b>${sym}</b>: ${human}`;
                    });
                    html += '<br/><br/>' + rows.join('<br/>');
                }
                Swal.fire({ icon: 'error', title, html });
            } else {
                Swal.fire('Error','El servidor respondió con error','error');
            }
        }).catch(err=>{
            console.error(err);
            Swal.fire('Error','No se pudo enviar (fallback)','error');
        });
    });

    // Helper to handle incoming server messages (from WS or AJAX polling)
    function handleServerMessage(raw){
        const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if(msg.type === 'update' && Array.isArray(msg.instruments)){
            msg.instruments.forEach(it => {
                const row = document.querySelector(`#instruments tbody tr[data-symbol="${it.symbol}"]`);
                if(row){
                    row.querySelector('.price').textContent = Number(it.price).toFixed(2);
                    row.querySelector('.qty').textContent = it.qty;
                }
                priceMap[it.symbol] = Number(it.price);
                qtyMap[it.symbol] = it.qty;
            });
        }
        if(msg.status === 'ok' && msg.receivedFor){
            Swal.fire('Enviado','Servidor confirmó recepción para ' + msg.receivedFor,'success');
        }
    }

    // Polling fallback: fetch instruments periodically
    let pollTimer = null;
    function startPolling(){
        if(pollTimer) return;
        pollTimer = setInterval(()=>{
            fetch('/api/instruments.php').then(r=>r.json()).then(j=> handleServerMessage(j)).catch(e=>console.error('poll err',e));
        }, 1000);
        // initial immediate poll
        fetch('/api/instruments.php').then(r=>r.json()).then(j=> handleServerMessage(j)).catch(e=>console.error('poll err',e));
    }

    // Note: don't start polling unconditionally here. If WS connects it will drive updates.
    // Polling will be started from WS error/close handlers when necessary.
});
