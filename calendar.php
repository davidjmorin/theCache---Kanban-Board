<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Calendar - Kanban Board</title>
    <link rel="stylesheet" href="assets/css/styles.css?v5.0.0">
    <link rel="stylesheet" href="assets/css/calendar.css?v5.0.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1 class="company-name">Task Calendar</h1>
        </div>
        <div class="header-right">
            <button class="btn btn-secondary" onclick="window.location.href='/kanban.html'">
                <i class="fas fa-columns"></i> Board View
            </button>
            <button class="btn btn-primary" onclick="calendarApp.showTaskModal()">
                <i class="fas fa-plus"></i> Add Task
            </button>
            <div class="user-info">
                <span id="currentUser"></span>
                <button class="logout-btn" onclick="calendarApp.handleLogout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    </div>

    <div class="calendar-container">
        <div class="calendar-header">
            <button class="btn btn-icon" onclick="calendarApp.previousMonth()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h2 id="monthYear"></h2>
            <button class="btn btn-icon" onclick="calendarApp.nextMonth()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        
        <div class="calendar-grid">
            <div class="calendar-weekdays">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div id="calendarDays" class="calendar-days"></div>
        </div>
    </div>

    <!-- Task Modal -->
    <div id="taskModal" class="modal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2 id="taskModalTitle">Add Task</h2>
                <span class="close" data-modal="taskModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="taskForm">
                    <input type="hidden" id="taskId" name="taskId">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskTitle">Title</label>
                            <input type="text" id="taskTitle" name="taskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="taskStage">Stage</label>
                            <select id="taskStage" name="taskStage" required>
                                <option value="">Select Stage</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskAssignee">Assignee</label>
                            <select id="taskAssignee" name="taskAssignee">
                                <option value="">Unassigned</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskClient">Client</label>
                            <select id="taskClient" name="taskClient">
                                <option value="">No Client</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskStartDate">Start Date</label>
                            <input type="date" id="taskStartDate" name="taskStartDate">
                        </div>
                        <div class="form-group">
                            <label for="taskDueDate">Due Date</label>
                            <input type="date" id="taskDueDate" name="taskDueDate">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="taskDescription">Description</label>
                        <textarea id="taskDescription" name="taskDescription" rows="3"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-modal="taskModal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Task</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="assets/js/logo-helper.js?v=1.0"></script>
    <script src="assets/js/calendar.js"></script>
    <script>
        const calendarApp = new CalendarApp();
    </script>
</body>
</html> 