// --- CONFIGURAÇÃO ---
const WORKER_URL = 'https://gerador-rcc-upload.athropusoriginal.workers.dev';
const R2_BASE_URL = "https://pub-387b66f2a9024194a685cf8a80608f27.r2.dev/";

// Dispara o upload ao selecionar arquivos
document.getElementById('botaoEnviar').addEventListener('click', () => {
    document.getElementById('imagemUpload').click();
});

document.getElementById('imagemUpload').addEventListener('change', async function(event) {
    const arquivos = event.target.files;
    if (arquivos.length === 0) return;

    const lista = document.getElementById('containerGrupos');
    lista.innerHTML = ''; 
    const botao = document.getElementById('botaoEnviar');
    botao.innerText = "Enviando...";

    try {
        const albumId = crypto.randomUUID(); // Gera um ID único para o álbum
        let linksDasImagens = [];
        let miniaturasHTML = '';

        // 1. Faz o upload das imagens uma por uma
        for (let arquivo of arquivos) {
            const resposta = await fetch(`${WORKER_URL}/`, {
                method: 'POST',
                body: arquivo
            });
            const data = await resposta.json();
            const linkCompleto = R2_BASE_URL + data.fileName;
            
            linksDasImagens.push(linkCompleto);
            miniaturasHTML += `<img src="${linkCompleto}" class="thumb" onclick="abrirModal('${linkCompleto}')">`;
        }

        // 2. Registra o álbum no banco de dados (Cloudflare KV)
        await fetch(`${WORKER_URL}/criar-album`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ albumId, links: linksDasImagens })
        });

        // 3. Exibe o link do álbum e as miniaturas
        const linkDoAlbum = window.location.origin + `/album.html?id=${albumId}`;
        
        const divGrupo = document.createElement('div');
        divGrupo.className = 'item-upload';
        // HTML limpo, sem o quadrado branco e texto direto
        divGrupo.innerHTML = `
            <div class="galeria-preview">${miniaturasHTML}</div>
            <div class="controles-finais">
                <p>Link Gerado Com Sucesso!</p>
                <button id="btnCopiar" class="btn-acao" onclick="copiarTexto(this, '${linkDoAlbum}')">Copiar Link</button>
            </div>
        `;
        lista.appendChild(divGrupo);

    } catch (erro) {
        console.error(erro);
        alert("Erro ao criar o álbum. Tente novamente.");
    } finally {
        botao.innerText = "Selecionar Imagens";
    }
});

// Funções de Modal
function abrirModal(src) {
    const modal = document.getElementById("modalVisualizacao");
    document.getElementById("imagemAmpliada").src = src;
    modal.style.display = "block";
}

function fecharModal() {
    document.getElementById("modalVisualizacao").style.display = "none";
}

// Função de Cópia
function copiarTexto(btn, texto) {
    navigator.clipboard.writeText(texto);

const corOriginal = btn.style.backgroundColor;
    btn.textContent = "Copiado!";
    btn.style.backgroundColor = "#4CAF50"; 
    
    setTimeout(() => {
        btn.textContent = "Copiar Link";
        btn.style.backgroundColor = corOriginal;
    }, 2000);
}
const overlay = document.getElementById('overlayDrop');

// Exibe o quadrado quando arrastar para a tela
window.addEventListener('dragover', (e) => {
    e.preventDefault();
    overlay.style.display = 'flex';
});

// Esconde se sair da tela
window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) overlay.style.display = 'none';
});

// Esconde ao soltar e processa os arquivos
window.addEventListener('drop', (e) => {
    e.preventDefault();
    overlay.style.display = 'none';
    
    if (e.dataTransfer.files.length > 0) {
        processarUpload(e.dataTransfer.files);
    }
});