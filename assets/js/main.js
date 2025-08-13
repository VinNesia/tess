// Inisialisasi AOS
AOS.init({
  duration: 800,
  once: true,
});

// Debounce untuk search
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Fungsi memuat data template
async function loadTemplates() {
  try {
    const response = await fetch('assets/data/templates.json', { cache: 'default' });
    if (!response.ok) throw new Error('Failed to fetch templates');
    return await response.json();
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

// Menampilkan template di homepage
let currentPage = 1;
const itemsPerPage = 6;

async function displayTemplates(filter = 'all', search = '', page = 1) {
  const templateGrid = document.getElementById('templateGrid');
  const loadingSpinner = document.getElementById('loadingSpinner');
  loadingSpinner.style.display = 'block';
  templateGrid.innerHTML = '';

  let templates = await loadTemplates();
  if (templates.length === 0) {
    templateGrid.innerHTML = '<p class="text-center" role="alert">Maaf, data tidak dapat dimuat. Coba lagi nanti.</p>';
    loadingSpinner.style.display = 'none';
    return;
  }

  let filteredTemplates = templates;
  if (filter !== 'all') {
    filteredTemplates = filteredTemplates.filter(t => t.category === filter);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTemplates = filteredTemplates.filter(t => 
      t.name.toLowerCase().includes(searchLower) || t.category.toLowerCase().includes(searchLower)
    );
  }

  if (filter === 'all' && !search) {
    filteredTemplates.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  if (filteredTemplates.length === 0) {
    templateGrid.innerHTML = '<p class="text-center" role="alert">Tidak ada template yang cocok dengan pencarian Anda.</p>';
    loadingSpinner.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(start, start + itemsPerPage);

  paginatedTemplates.forEach(template => {
    const card = `
      <div class="col-md-4 col-sm-6 template-card" data-aos="fade-up" role="article">
        <div class="card">
          <img src="assets/${template.image}" class="card-img-top" alt="${template.name} - Template Website Responsif" loading="lazy">
          <div class="card-body">
            <h5 class="card-title">${template.name}</h5>
            <p class="price">${template.price}</p>
            <a href="detail.html?id=${template.id}" class="btn btn-primary" aria-label="Lihat detail ${template.name}">Lihat Detail</a>
            <button class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#demoModal" onclick="loadDemo('${template.demo}')" aria-label="Lihat demo ${template.name}">Lihat Demo</button>
          </div>
        </div>
      </div>
    `;
    templateGrid.innerHTML += card;
  });

  renderPagination(totalPages, page);
  loadingSpinner.style.display = 'none';
}

// Render pagination
function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#" aria-label="Halaman ${i}">${i}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      displayTemplates(
        document.getElementById('categoryFilter').value,
        document.getElementById('searchInput').value,
        i
      );
    });
    pagination.appendChild(li);
  }
}

// Menampilkan detail template
async function displayTemplateDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const templates = await loadTemplates();
  const template = templates.find(t => t.id == id);
  const templateDetail = document.getElementById('templateDetail');
  const loadingSpinner = document.getElementById('loadingSpinner');

  if (!template) {
    templateDetail.innerHTML = '<p class="text-center" role="alert">Template tidak ditemukan.</p>';
    loadingSpinner.style.display = 'none';
    return;
  }

  templateDetail.innerHTML = `
    <div class="col-md-6">
      <img src="assets/${template.image}" alt="${template.name} - Template Website Responsif" class="img-fluid" loading="lazy">
    </div>
    <div class="col-md-6">
      <h2>${template.name}</h2>
      <p class="price">${template.price}</p>
      <p>${template.description}</p>
      <a href="${template.demo}" target="_blank" class="btn btn-primary" aria-label="Lihat demo ${template.name}">Lihat Demo</a>
    </div>
  `;

  // SEO
  document.title = `${template.name} - Marketplace Template`;
  document.querySelector('meta[name="description"]').content = template.description;
  document.querySelector('meta[name="keywords"]').content = `template ${template.category}, beli template, ${template.name}`;
  document.querySelector('link[rel="canonical"]').href = `https://yourdomain.com/detail.html?id=${id}`;

  // Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": template.name,
    "image": `assets/${template.image}`,
    "description": template.description,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "IDR",
      "price": template.price.replace('Rp ', '').replace('.', ''),
      "availability": "https://schema.org/InStock"
    }
  };
  document.getElementById('structuredData').innerHTML = JSON.stringify(structuredData);

  // Form handler
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const notes = document.getElementById('notes').value;

    const message = `Saya tertarik dengan ${template.name} (${template.price}). Detail: Nama: ${name}, Email: ${email}, Catatan: ${notes}. Deskripsi template: ${template.description}`;
    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  });

  loadingSpinner.style.display = 'none';
}

// Contact form handler
if (document.getElementById('contactForm')) {
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;

    const whatsappMessage = `Pesan dari ${name} (${email}): ${message}`;
    const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(whatsappMessage)}`;
    window.location.href = whatsappUrl;
  });
}

// Modal demo
function loadDemo(url) {
  document.getElementById('demoIframe').src = url;
}

// Event listeners
if (document.getElementById('templateGrid')) {
  const savedFilter = localStorage.getItem('categoryFilter') || 'all';
  const savedSearch = localStorage.getItem('searchQuery') || '';
  document.getElementById('categoryFilter').value = savedFilter;
  document.getElementById('searchInput').value = savedSearch;
  displayTemplates(savedFilter, savedSearch);

  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    localStorage.setItem('categoryFilter', e.target.value);
    displayTemplates(e.target.value, document.getElementById('searchInput').value);
  });

  document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    localStorage.setItem('searchQuery', e.target.value);
    displayTemplates(document.getElementById('categoryFilter').value, e.target.value);
  }, 300));
} else if (document.getElementById('templateDetail')) {
  displayTemplateDetail();
}
