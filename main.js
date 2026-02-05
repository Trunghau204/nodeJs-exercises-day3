const API = "https://api.escuelajs.co/api/v1/products";
let products = [];
let currentPage = 1;
let pageSize = 10;
let sortField = "";
let sortAsc = true;

async function fetchData() {
  const res = await fetch(API);
  products = await res.json();
  render();
}

function render() {
  let filtered = products.filter((p) =>
    p.title.toLowerCase().includes(searchInput.value.toLowerCase()),
  );

  if (sortField) {
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }

  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  tableBody.innerHTML = "";
  paginated.forEach((p) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-bs-toggle", "tooltip");
    tr.setAttribute("data-bs-title", p.description || "No description");
    tr.onclick = () => openDetail(p);
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.category?.name || "N/A"}</td>
      <td>$${p.price}</td>
      <td><img src="${p.images[0]}" class="img-thumb" alt="${p.title}"></td>
    `;
    tableBody.appendChild(tr);
  });

  // Initialize tooltips for newly created rows
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
  );

  renderPagination(filtered.length);
}

function renderPagination(total) {
  pagination.innerHTML = "";
  const pages = Math.ceil(total / pageSize);

  // Previous button
  pagination.innerHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" onclick="gotoPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
    </li>`;

  // Page numbers
  for (let i = 1; i <= pages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <button class="page-link" onclick="gotoPage(${i})">${i}</button>
      </li>`;
  }

  // Next button
  pagination.innerHTML += `
    <li class="page-item ${currentPage === pages ? "disabled" : ""}">
      <button class="page-link" onclick="gotoPage(${currentPage + 1})" ${currentPage === pages ? "disabled" : ""}>Next</button>
    </li>`;
}

function gotoPage(p) {
  currentPage = p;
  render();
}

function sortBy(field) {
  sortAsc = sortField === field ? !sortAsc : true;
  sortField = field;
  render();
}

function exportCSV() {
  let csv = "id,title,price\n";
  products.forEach((p) => (csv += `${p.id},${p.title},${p.price}\n`));
  const blob = new Blob([csv]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "products.csv";
  a.click();
}

function openDetail(p) {
  editId.value = p.id;
  editTitle.value = p.title;
  editPrice.value = p.price;
  editDesc.value = p.description;
  new bootstrap.Modal(detailModal).show();
}

async function updateProduct() {
  try {
    await fetch(`${API}/${editId.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.value,
        price: +editPrice.value,
        description: editDesc.value,
      }),
    });

    // Close modal using data attribute
    document.querySelector("#detailModal .btn-close").click();

    // Update local data
    const productIndex = products.findIndex((p) => p.id == editId.value);
    if (productIndex !== -1) {
      products[productIndex].title = editTitle.value;
      products[productIndex].price = +editPrice.value;
      products[productIndex].description = editDesc.value;
    }

    render();

    // Show success message
    setTimeout(() => {
      alert("Product updated successfully!");
    }, 300);
  } catch (error) {
    console.error("Error updating product:", error);
    alert("Failed to update product");
  }
}

async function createProduct() {
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.value,
        price: +newPrice.value,
        description: newDesc.value,
        categoryId: +newCategory.value,
        images: [newImage.value],
      }),
    });

    const newProduct = await response.json();

    // Close modal using data attribute
    document.querySelector("#createModal .btn-close").click();

    // Reset form
    newTitle.value = "";
    newPrice.value = "";
    newDesc.value = "";
    newCategory.value = "";
    newImage.value = "";

    // Refresh data
    await fetchData();

    // Show success message
    setTimeout(() => {
      alert("Product created successfully!");
    }, 300);
  } catch (error) {
    console.error("Error creating product:", error);
    alert("Failed to create product");
  }
}

searchInput.oninput = () => {
  currentPage = 1; // Reset to page 1 when searching
  render();
};

pageSize.onchange = () => {
  pageSize = +pageSize.value;
  currentPage = 1; // Reset to page 1 when changing page size
  render();
};

fetchData();
