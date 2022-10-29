Array.from(document.getElementById('viewSelect').children).forEach(e => {
    e.onclick = function() {
        Array.from(document.getElementById('editPanes').children).forEach(n => n.style.display = 'none');
        document.getElementById(e.getAttribute('selectpane') + 'Pane').style.display = '';
        Array.from(document.getElementById('viewSelect').children).forEach(e2 => {
            e2.style.borderTopColor = '';
        });
        e.style.borderTopColor = 'black';
    };
});
document.getElementById('viewSelect').children[0].onclick();