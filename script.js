document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Casa'];
    let editingProductId = null;
    
    // Elementos do DOM
    const productsTable = document.getElementById('products-table');
    const productForm = document.getElementById('product-form');
    const productModal = document.getElementById('product-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const addProductBtn = document.getElementById('add-product-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const confirmBtn = document.getElementById('confirm-btn');
    const filterCategory = document.getElementById('filter-category');
    const productCategory = document.getElementById('product-category');
    
    // Inicialização
    initCategories();
    renderProducts();
    updateStats();
    
    // Event Listeners
    addProductBtn.addEventListener('click', () => openProductModal());
    productForm.addEventListener('submit', handleProductSubmit);
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    confirmBtn.addEventListener('click', handleConfirmAction);
    filterCategory.addEventListener('change', renderProducts);
    
    // Funções de inicialização
    function initCategories() {
        // Preencher select de categorias no modal
        productCategory.innerHTML = '<option value="">Selecione...</option>';
        categories.forEach(category => {
            productCategory.innerHTML += `<option value="${category}">${category}</option>`;
        });
        
        // Preencher select de categorias no filtro
        filterCategory.innerHTML = '<option value="">Todas categorias</option>';
        categories.forEach(category => {
            filterCategory.innerHTML += `<option value="${category}">${category}</option>`;
        });
    }
    
    // Funções de renderização
    function renderProducts() {
        const selectedCategory = filterCategory.value;
        let filteredProducts = products;
        
        if (selectedCategory) {
            filteredProducts = products.filter(product => product.category === selectedCategory);
        }
        
        const tbody = productsTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado</td></tr>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const status = getStockStatus(product.quantity);
            const statusClass = status === 'Em estoque' ? 'in-stock' : 
                              status === 'Baixo estoque' ? 'low-stock' : 'out-of-stock';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td class="actions">
                    <button class="action-btn edit" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adicionar event listeners aos botões de ação
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
        });
    }
    
    function updateStats() {
        document.getElementById('total-products').textContent = products.length;
        
        const inStock = products.filter(p => p.quantity > 10).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        
        document.getElementById('in-stock').textContent = inStock;
        document.getElementById('low-stock').textContent = lowStock;
        document.getElementById('out-of-stock').textContent = outOfStock;
    }
    
    // Funções auxiliares
    function getStockStatus(quantity) {
        if (quantity > 10) return 'Em estoque';
        if (quantity > 0) return 'Baixo estoque';
        return 'Sem estoque';
    }
    
    function generateProductCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        
        for (let i = 0; i < 2; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        for (let i = 0; i < 4; i++) {
            code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        return code;
    }
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Funções de manipulação de produtos
    function addProduct(product) {
        products.push(product);
        saveProducts();
        renderProducts();
        updateStats();
    }
    
    function updateProduct(id, updatedProduct) {
        products = products.map(product => 
            product.id === id ? { ...updatedProduct, id } : product
        );
        saveProducts();
        renderProducts();
        updateStats();
    }
    
    function deleteProduct(id) {
        products = products.filter(product => product.id !== id);
        saveProducts();
        renderProducts();
        updateStats();
    }
    
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }
    
    // Funções de modal
    function openProductModal(product = null) {
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('product-form');
        
        if (product) {
            modalTitle.textContent = 'Editar Produto';
            editingProductId = product.id;
            
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-code').value = product.code;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-quantity').value = product.quantity;
            document.getElementById('product-description').value = product.description || '';
        } else {
            modalTitle.textContent = 'Adicionar Novo Produto';
            editingProductId = null;
            form.reset();
            document.getElementById('product-code').value = generateProductCode();
        }
        
        productModal.classList.add('active');
    }
    
    function confirmDelete(id) {
        const product = products.find(p => p.id === id);
        document.getElementById('confirm-message').textContent = `Tem certeza que deseja excluir o produto "${product.name}"?`;
        confirmBtn.dataset.id = id;
        confirmModal.classList.add('active');
    }
    
    function closeAllModals() {
        productModal.classList.remove('active');
        confirmModal.classList.remove('active');
    }
    
    // Handlers de eventos
    function handleProductSubmit(e) {
        e.preventDefault();
        
        const product = {
            name: document.getElementById('product-name').value.trim(),
            code: document.getElementById('product-code').value.trim(),
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value),
            quantity: parseInt(document.getElementById('product-quantity').value),
            description: document.getElementById('product-description').value.trim()
        };
        
        if (editingProductId) {
            updateProduct(editingProductId, product);
        } else {
            product.id = generateId();
            addProduct(product);
        }
        
        closeAllModals();
    }
    
    function handleConfirmAction() {
        const productId = confirmBtn.dataset.id;
        deleteProduct(productId);
        closeAllModals();
    }
    
    function editProduct(id) {
        const product = products.find(p => p.id === id);
        openProductModal(product);
    }
    
    // Adicionar alguns produtos de exemplo se estiver vazio
    if (products.length === 0) {
        const sampleProducts = [
            {
                id: generateId(),
                name: 'Smartphone Galaxy S21',
                code: generateProductCode(),
                category: 'Eletrônicos',
                price: 3999.99,
                quantity: 15,
                description: 'Smartphone top de linha da Samsung'
            },
            {
                id: generateId(),
                name: 'Notebook Dell Inspiron',
                code: generateProductCode(),
                category: 'Eletrônicos',
                price: 4599.00,
                quantity: 8,
                description: 'Notebook com processador i7 e 16GB RAM'
            },
            {
                id: generateId(),
                name: 'Camiseta Branca',
                code: generateProductCode(),
                category: 'Roupas',
                price: 49.90,
                quantity: 25,
                description: 'Camiseta básica branca 100% algodão'
            },
            {
                id: generateId(),
                name: 'Arroz Integral',
                code: generateProductCode(),
                category: 'Alimentos',
                price: 8.50,
                quantity: 0,
                description: 'Pacote 5kg de arroz integral'
            }
        ];
        
        products = sampleProducts;
        saveProducts();
        renderProducts();
        updateStats();
    }
});