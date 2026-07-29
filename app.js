// ==========================================
// 1. CLASSES & PERSISTANCE DE DONNÉES (POO)
// ==========================================

class Task {
  constructor(id, title, priority, dueDateTime, isCompleted = false) {
    this.id = id;
    this.title = title;
    this.priority = priority; 
    this.dueDateTime = new Date(dueDateTime);
    this.isCompleted = isCompleted;
  }

  toggleStatus() {
    this.isCompleted = !this.isCompleted;
  }

  isLate() {
    return !this.isCompleted && new Date() > this.dueDateTime;
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all'; 
    this.searchQuery = '';
    this.loadFromLocalStorage(); // Charger au démarrage
  }

  addTask(title, priority, dueDateTime) {
    const id = Date.now();
    const newTask = new Task(id, title, priority, dueDateTime);
    this.tasks.push(newTask);
    this.saveToLocalStorage();
    return newTask;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.saveToLocalStorage();
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.toggleStatus();
      this.saveToLocalStorage();
    }
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      let matchesFilter = true;

      if (this.currentFilter === 'completed') matchesFilter = task.isCompleted;
      if (this.currentFilter === 'important') matchesFilter = task.priority === 'haute';
      if (this.currentFilter === 'late') matchesFilter = task.isLate();

      return matchesSearch && matchesFilter;
    });
  }

  getCompletionPercentage() {
    if (this.tasks.length === 0) return 0;
    const completedCount = this.tasks.filter(t => t.isCompleted).length;
    return Math.round((completedCount / this.tasks.length) * 100);
  }

  getStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedCount = this.tasks.filter(t => t.isCompleted).length;
    const todayCount = this.tasks.filter(t => t.dueDateTime.toISOString().split('T')[0] === todayStr).length;
    return { completed: completedCount, today: todayCount };
  }

  // Sauvegarde dans le navigateur
  saveToLocalStorage() {
    localStorage.setItem('task_manager_data', JSON.stringify(this.tasks));
  }

  // Restauration des objets
  loadFromLocalStorage() {
    const data = localStorage.getItem('task_manager_data');
    if (data) {
      const rawTasks = JSON.parse(data);
      this.tasks = rawTasks.map(t => new Task(t.id, t.title, t.priority, t.dueDateTime, t.isCompleted));
    }
  }
}

const manager = new TaskManager();

// ==========================================
// 2. GESTIONNAIRE DE TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast');

  if (type === 'danger') toast.classList.add('toast-danger');
  if (type === 'success') toast.classList.add('toast-success');

  const icons = {
    info: 'bx-info-circle',
    success: 'bx-check-circle',
    danger: 'bx-trash'
  };

  toast.innerHTML = `
    <i class='bx ${icons[type]}'></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-suppression après 3 secondes
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==========================================
// 3. RENDER ET INTERACTION DOM
// ==========================================

const tasksContainer = document.getElementById('tasks-container');
const mainTitle = document.getElementById('main-title');
const menuButtons = document.querySelectorAll('.sidebar-menu .menu-item');
const searchInput = document.getElementById('search-input');
const statCompleted = document.getElementById('stat-completed');
const statToday = document.getElementById('stat-today');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');

// Éléments du Formulaire Modal
const modal = document.getElementById('task-modal');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const taskForm = document.getElementById('task-form');

function render() {
  const stats = manager.getStats();
  statCompleted.textContent = stats.completed;
  statToday.textContent = stats.today;

  const percentage = manager.getCompletionPercentage();
  progressBarFill.style.width = `${percentage}%`;
  progressPercent.textContent = `${percentage}%`;

  const titles = {
    all: "Toutes les tâches",
    completed: "Tâches Complétées",
    important: "Tâches Importantes",
    late: "Tâches En Retard"
  };
  mainTitle.textContent = titles[manager.currentFilter] || "Toutes les tâches";

  tasksContainer.innerHTML = '';
  const tasksToDisplay = manager.getFilteredTasks();

  if (tasksToDisplay.length === 0) {
    tasksContainer.innerHTML = `<p style="color: #9ca3af; text-align: center; margin-top: 20px;">Aucune tâche trouvée.</p>`;
    return;
  }

  tasksToDisplay.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.classList.add('task-card');
    if (task.isCompleted) taskCard.classList.add('task-completed');
    if (task.isLate()) taskCard.classList.add('task-late');
    
    taskCard.dataset.id = task.id;

    const checkIcon = task.isCompleted ? "bxs-check-circle" : "bx-circle";
    const dateFormatted = task.dueDateTime.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    taskCard.innerHTML = `
      <button class="btn-check">
        <i class='bx ${checkIcon}'></i>
      </button>

      <div class="task-info">
        <h3>${task.title}</h3>
        <span class="task-date"><i class='bx bx-time'></i> ${dateFormatted} ${task.isLate() ? '(En retard)' : ''}</span>
      </div>

      <span class="badge priority-${task.priority}">${task.priority.toUpperCase()}</span>

      <div class="task-actions">
        <button class="btn-delete"><i class='bx bx-trash'></i></button>
      </div>
    `;

    tasksContainer.appendChild(taskCard);
  });
}

// EVÉNEMENTS RECHERCHE & FILTRES
searchInput.addEventListener('input', (e) => {
  manager.searchQuery = e.target.value;
  render();
});

menuButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    menuButtons.forEach(btn => btn.classList.remove('active'));
    const currentBtn = e.currentTarget;
    currentBtn.classList.add('active');

    manager.currentFilter = currentBtn.dataset.filter;
    render();
  });
});

// EVÉNEMENTS MODAL
btnOpenModal.addEventListener('click', () => {
  // Définir la date courante par défaut dans le champ
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('task-datetime').value = now.toISOString().slice(0, 16);
  
  modal.classList.remove('hidden');
});

const closeModal = () => {
  modal.classList.add('hidden');
  taskForm.reset();
};

btnCloseModal.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);

// SOUMISSION DU FORMULAIRE
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const title = document.getElementById('task-title').value;
  const priority = document.getElementById('task-priority').value;
  const datetime = document.getElementById('task-datetime').value;

  manager.addTask(title, priority, datetime);
  closeModal();
  render();
  
  showToast("Nouvelle tâche ajoutée !", "success");
});

// CLIC SUR LISTE DES TÂCHES (Délegation)
tasksContainer.addEventListener('click', (e) => {
  const card = e.target.closest('.task-card');
  if (!card) return;

  const taskId = Number(card.dataset.id);

  if (e.target.closest('.btn-delete')) {
    manager.deleteTask(taskId);
    render();
    showToast("Tâche supprimée.", "danger");
  }

  if (e.target.closest('.btn-check')) {
    manager.toggleTask(taskId);
    render();
    showToast("Statut de la tâche mis à jour.", "info");
  }
});

// Rendu initial
render();