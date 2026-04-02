$(document).ready(function() {
    let tasks = [];
    let currentFilter = "all";
    
    function generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }
    
    function loadFromStorage() {
        const stored = localStorage.getItem("taskflow_tasks");
        if(stored) {
            try {
                tasks = JSON.parse(stored);
                tasks = tasks.filter(t => t && typeof t === 'object').map(t => ({
                    id: t.id || generateId(),
                    text: t.text || "untitled",
                    completed: t.completed === true
                }));
            } catch(e) { tasks = []; }
        } else {
            tasks = [
                { id: generateId(), text: "Explore jQuery features 🔍", completed: false },
                { id: generateId(), text: "Style the to-do list with CSS 🎨", completed: true },
                { id: generateId(), text: "Add new tasks & filter them", completed: false }
            ];
        }
        renderAll();
    }
    
    function saveToStorage() {
        localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
    }
    
    function addTask(taskText) {
        if(!taskText || taskText.trim() === "") {
            $("#taskInput").addClass("error-shake");
            setTimeout(() => $("#taskInput").removeClass("error-shake"), 400);
            return false;
        }
        const newTask = {
            id: generateId(),
            text: taskText.trim(),
            completed: false
        };
        tasks.push(newTask);
        saveToStorage();
        renderAll();
        return true;
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveToStorage();
        renderAll();
    }
    
    function toggleComplete(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if(task) {
            task.completed = !task.completed;
            saveToStorage();
            renderAll();
        }
    }
    
    function editTask(taskId, newText) {
        if(!newText || newText.trim() === "") return false;
        const task = tasks.find(t => t.id === taskId);
        if(task) {
            task.text = newText.trim();
            saveToStorage();
            renderAll();
            return true;
        }
        return false;
    }
    
    function getFilteredTasks() {
        if(currentFilter === "all") return tasks;
        if(currentFilter === "pending") return tasks.filter(t => !t.completed);
        if(currentFilter === "completed") return tasks.filter(t => t.completed);
        return tasks;
    }
    
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        $("#totalCount").text(total);
        $("#completedCount").text(completed);
        $("#pendingCount").text(pending);
    }
    
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    }
    
    function renderList() {
        const filtered = getFilteredTasks();
        const $list = $("#todoList");
        $list.empty();
        
        if(filtered.length === 0) {
            let emptyMsg = "";
            if(currentFilter === "all") emptyMsg = "No tasks yet. Add one above! ✨";
            else if(currentFilter === "pending") emptyMsg = "All tasks completed! 🎉 Great job!";
            else emptyMsg = "No completed tasks yet. Finish some tasks ✅";
            $list.append(`<li class="empty-message"><i class="fas fa-smile-wink"></i><br>${emptyMsg}</li>`);
            updateStats();
            return;
        }
        
        filtered.forEach(task => {
            const taskClass = task.completed ? "todo-item completed-task" : "todo-item";
            const safeText = escapeHtml(task.text);
            const itemHtml = `
                <li class="${taskClass}" data-id="${task.id}">
                    <div class="task-content">
                        <input type="checkbox" class="task-check" ${task.completed ? "checked" : ""}>
                        <span class="task-text">${safeText}</span>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" title="Edit task"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" title="Delete task"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </li>
            `;
            $list.append(itemHtml);
        });
        updateStats();
    }
    
    function bindTaskEvents() {
        $("#todoList").off("change", ".task-check").on("change", ".task-check", function(e) {
            e.stopPropagation();
            const $li = $(this).closest(".todo-item");
            const taskId = $li.data("id");
            if(taskId) toggleComplete(taskId);
        });
        
        $("#todoList").off("click", ".delete-btn").on("click", ".delete-btn", function(e) {
            e.stopPropagation();
            const $li = $(this).closest(".todo-item");
            const taskId = $li.data("id");
            if(taskId) deleteTask(taskId);
        });
        
        $("#todoList").off("click", ".edit-btn").on("click", ".edit-btn", function(e) {
            e.stopPropagation();
            const $li = $(this).closest(".todo-item");
            const taskId = $li.data("id");
            const currentText = tasks.find(t => t.id === taskId)?.text || "";
            if(!taskId) return;
            let newText = prompt("Edit your task:", currentText);
            if(newText !== null && newText.trim() !== "") {
                editTask(taskId, newText);
            } else if(newText !== null && newText.trim() === "") {
                alert("Task cannot be empty!");
            }
        });
        
        $("#todoList").off("click", ".task-text").on("click", ".task-text", function(e) {
            e.stopPropagation();
            const $li = $(this).closest(".todo-item");
            const taskId = $li.data("id");
            const currentText = tasks.find(t => t.id === taskId)?.text || "";
            if(taskId) {
                let newText = prompt("Update task:", currentText);
                if(newText !== null && newText.trim() !== "") {
                    editTask(taskId, newText);
                } else if(newText !== null) {
                    alert("Task text cannot be empty.");
                }
            }
        });
    }
    
    function renderAll() {
        renderList();
        bindTaskEvents();
        $(".filter-btn").removeClass("active");
        $(`.filter-btn[data-filter="${currentFilter}"]`).addClass("active");
    }
    
    function initEventHandlers() {
        $("#addTaskBtn").on("click", function() {
            const taskText = $("#taskInput").val();
            if(addTask(taskText)) {
                $("#taskInput").val("").focus();
            } else {
                $("#taskInput").css("border-color", "#e5483b").delay(300).queue(function(next){
                    $(this).css("border-color", "#e2e8f0");
                    next();
                });
            }
        });
        
        $("#taskInput").on("keypress", function(e) {
            if(e.which === 13) {
                e.preventDefault();
                $("#addTaskBtn").click();
            }
        });
        
        $(".filter-btn").on("click", function() {
            const filterVal = $(this).data("filter");
            if(filterVal) {
                currentFilter = filterVal;
                renderAll();
            }
        });
    }
    
    loadFromStorage();
    initEventHandlers();
    $("#taskInput").focus();
});