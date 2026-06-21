const defaultUser = {
  email: "admin@alkewallet.com",
  password: "123456",
  name: "Gustavo"
};

function initStorage() {
  if (!localStorage.getItem("walletBalance")) {
    localStorage.setItem("walletBalance", "150000");
  }

  if (!localStorage.getItem("walletTransactions")) {
    localStorage.setItem("walletTransactions", JSON.stringify([]));
  }

  if (!localStorage.getItem("walletContacts")) {
    localStorage.setItem("walletContacts", JSON.stringify([
      "María González",
      "Pedro Rojas",
      "Camila Torres",
      "Juan Soto"
    ]));
  }
}

function getBalance() {
  return parseInt(localStorage.getItem("walletBalance")) || 0;
}

function setBalance(amount) {
  localStorage.setItem("walletBalance", amount.toString());
}

function getTransactions() {
  return JSON.parse(localStorage.getItem("walletTransactions")) || [];
}

function setTransactions(transactions) {
  localStorage.setItem("walletTransactions", JSON.stringify(transactions));
}

function getContacts() {
  return JSON.parse(localStorage.getItem("walletContacts")) || [];
}

function setContacts(contacts) {
  localStorage.setItem("walletContacts", JSON.stringify(contacts));
}

function formatCurrency(value) {
  return "$" + value.toLocaleString("es-CL");
}

function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString("es-CL");
}

function addTransaction(type, detail, amount) {
  const transactions = getTransactions();
  transactions.unshift({
    date: getCurrentDateTime(),
    type,
    detail,
    amount
  });
  setTransactions(transactions);
}

function updateBalanceViews() {
  const balance = formatCurrency(getBalance());

  $("#currentBalance").text(balance);
  $("#depositCurrentBalance").text(balance);
  $("#sendCurrentBalance").text(balance);
  $("#transactionsBalance").text(balance);
}

function loadMenuSummary() {
  const transactions = getTransactions();

  $("#userName").text(defaultUser.name);

  const deposit = transactions.find(t => t.type === "Depósito");
  const transfer = transactions.find(t => t.type === "Transferencia");

  $("#lastDeposit").text(deposit ? formatCurrency(deposit.amount) : "Sin depósitos");
  $("#lastTransfer").text(transfer ? formatCurrency(transfer.amount) : "Sin transferencias");

  const recentContainer = $("#recentTransactionsMenu");
  recentContainer.empty();

  if (transactions.length === 0) {
    recentContainer.append(`<li class="list-group-item text-muted">No hay movimientos recientes.</li>`);
    return;
  }

  transactions.slice(0, 5).forEach(t => {
    recentContainer.append(`
      <li class="list-group-item">
        <div class="fw-semibold">${t.type}</div>
        <div class="small text-muted">${t.detail}</div>
        <div class="small">${t.date} - ${formatCurrency(t.amount)}</div>
      </li>
    `);
  });
}

function loadTransactionsTable() {
  const transactions = getTransactions();
  const tableBody = $("#transactionsTableBody");
  tableBody.empty();

  if (transactions.length === 0) {
    tableBody.append(`
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No existen movimientos registrados.</td>
      </tr>
    `);
    return;
  }

  transactions.forEach(t => {
    tableBody.append(`
      <tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.detail}</td>
        <td>${formatCurrency(t.amount)}</td>
      </tr>
    `);
  });
}

function loadContacts() {
  const contacts = getContacts();
  const contactsContainer = $("#contactsContainer");
  const datalist = $("#contactList");

  contactsContainer.empty();
  datalist.empty();

  if (contacts.length === 0) {
    contactsContainer.append(`<li class="list-group-item text-muted">No hay contactos registrados.</li>`);
    return;
  }

  contacts.forEach(contact => {
    contactsContainer.append(`<li class="list-group-item">${contact}</li>`);
    datalist.append(`<option value="${contact}"></option>`);
  });
}

$(document).ready(function () {
  initStorage();
  updateBalanceViews();
  loadMenuSummary();
  loadTransactionsTable();
  loadContacts();

  $("main, .card").hide().fadeIn(600);

  $("#loginForm").on("submit", function (e) {
    e.preventDefault();

    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (email === "" || password === "") {
      $("#loginMessage").html(`<span class="error-message">Completa todos los campos.</span>`);
      return;
    }

    if (email === defaultUser.email && password === defaultUser.password) {
      $("#loginMessage").html(`<span class="success-message">Credenciales correctas. Redirigiendo...</span>`);
      setTimeout(() => {
        window.location.href = "menu.html";
      }, 1000);
    } else {
      $("#loginMessage").html(`<span class="error-message">Credenciales incorrectas.</span>`);
    }
  });

  $("#depositForm").on("submit", function (e) {
    e.preventDefault();

    const amount = parseInt($("#depositAmount").val());

    if (!amount || amount <= 0) {
      $("#depositMessage").html(`<span class="error-message">Ingresa un monto válido.</span>`);
      return;
    }

    const newBalance = getBalance() + amount;
    setBalance(newBalance);
    addTransaction("Depósito", "Ingreso de fondos a la cuenta", amount);
    updateBalanceViews();

    $("#depositMessage").hide().html(`<span class="success-message">Depósito realizado con éxito.</span>`).fadeIn();
    $("#depositForm")[0].reset();
  });

  // Abre modal de confirmación antes de transferir
$("#btnOpenTransferModal").on("click", function () {
  const contact = $("#contactSearch").val().trim();
  const amount = parseInt($("#sendAmount").val());
  const contacts = getContacts();
  const balance = getBalance();

  if (contact === "" || !amount || amount <= 0) {
    $("#sendMessage").html(`<span class="error-message">Completa correctamente todos los campos.</span>`);
    return;
  }
  if (!contacts.includes(contact)) {
    $("#sendMessage").html(`<span class="error-message">El contacto no existe en la lista.</span>`);
    return;
  }
  if (amount > balance) {
    $("#sendMessage").html(`<span class="error-message">Saldo insuficiente para realizar la transferencia.</span>`);
    return;
  }

  $("#modalTransferDetail").text(`¿Confirmas el envío de ${formatCurrency(amount)} a ${contact}?`);
  const modal = new bootstrap.Modal(document.getElementById("confirmTransferModal"));
  modal.show();
});

// Ejecuta la transferencia al confirmar en el modal
$("#btnConfirmTransfer").on("click", function () {
  const contact = $("#contactSearch").val().trim();
  const amount = parseInt($("#sendAmount").val());
  const newBalance = getBalance() - amount;

  setBalance(newBalance);
  addTransaction("Transferencia", `Envío de dinero a ${contact}`, amount);
  updateBalanceViews();

  bootstrap.Modal.getInstance(document.getElementById("confirmTransferModal")).hide();
  $("#sendMessage").hide().html(`<span class="success-message">Transferencia realizada correctamente.</span>`).fadeIn();
  $("#sendMoneyForm")[0].reset();
});

  $("#addContactForm").on("submit", function (e) {
    e.preventDefault();

    const newContact = $("#newContact").val().trim();
    const contacts = getContacts();

    if (newContact === "") {
      $("#contactMessage").html(`<span class="error-message">Ingresa un nombre válido.</span>`);
      return;
    }

    if (contacts.includes(newContact)) {
      $("#contactMessage").html(`<span class="error-message">Ese contacto ya existe.</span>`);
      return;
    }

    contacts.push(newContact);
    setContacts(contacts);
    loadContacts();

    $("#contactMessage").hide().html(`<span class="success-message">Contacto agregado correctamente.</span>`).fadeIn();
    $("#addContactForm")[0].reset();
  });

  $("#logoutBtn").on("click", function () {
    alert("Sesión cerrada correctamente.");
  });
});