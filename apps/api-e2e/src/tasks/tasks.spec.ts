import axios from 'axios';
import { TaskStatus, TaskPriority } from '@challenge/data';

describe('Tasks API E2E Tests', () => {
  const baseUrl = 'http://localhost:3000/api/v1';
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let createdTaskId: string;

  beforeAll(async () => {
    // Setup: Login and get auth token
    try {
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      authToken = loginResponse.data.access_token;
      userId = loginResponse.data.user.id;
      organizationId = loginResponse.data.user.organizationId;
    } catch (error) {
      console.warn('Login failed, using mock token for testing');
      authToken = 'mock-jwt-token';
      userId = 'test-user-id';
      organizationId = 'test-org-id';
    }
  });

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  describe('GET /api/v1/tasks', () => {
    it('should fetch tasks successfully', async () => {
      const response = await axios.get(`${baseUrl}/tasks`, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch tasks with filters', async () => {
      const params = new URLSearchParams({
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        search: 'test'
      });

      const response = await axios.get(`${baseUrl}/tasks?${params}`, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      try {
        await axios.get(`${baseUrl}/tasks`);
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should return 401 with invalid token', async () => {
      try {
        await axios.get(`${baseUrl}/tasks`, {
          headers: {
            'Authorization': 'Bearer invalid-token',
            'Content-Type': 'application/json'
          }
        });
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'E2E Test Task',
        description: 'Task created during E2E testing',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeId: userId,
        organizationId: organizationId
      };

      const response = await axios.post(`${baseUrl}/tasks`, taskData, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(taskData.title);
      expect(response.data.description).toBe(taskData.description);
      expect(response.data.priority).toBe(taskData.priority);
      expect(response.data.status).toBe(taskData.status);
      expect(response.data.assigneeId).toBe(taskData.assigneeId);
      expect(response.data.organizationId).toBe(taskData.organizationId);
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');

      createdTaskId = response.data.id;
    });

    it('should create a task without assignee', async () => {
      const taskData = {
        title: 'Unassigned Task',
        description: 'Task without assignee',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      const response = await axios.post(`${baseUrl}/tasks`, taskData, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(201);
      expect(response.data.title).toBe(taskData.title);
      expect(response.data.assigneeId).toBeNull();
    });

    it('should return 400 for invalid task data', async () => {
      const invalidTaskData = {
        title: '', // Empty title should be invalid
        description: 'Invalid task',
        priority: 'invalid-priority',
        status: 'invalid-status',
        organizationId: organizationId
      };

      try {
        await axios.post(`${baseUrl}/tasks`, invalidTaskData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should return 401 without authentication', async () => {
      const taskData = {
        title: 'Unauthorized Task',
        description: 'Should fail',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      try {
        await axios.post(`${baseUrl}/tasks`, taskData);
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    beforeEach(async () => {
      // Create a task for testing updates
      if (!createdTaskId) {
        const taskData = {
          title: 'Update Test Task',
          description: 'Task for update testing',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          organizationId: organizationId
        };

        const response = await axios.post(`${baseUrl}/tasks`, taskData, {
          headers: getAuthHeaders()
        });
        createdTaskId = response.data.id;
      }
    });

    it('should update a task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated task description',
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: userId
      };

      const response = await axios.put(`${baseUrl}/tasks/${createdTaskId}`, updateData, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.description).toBe(updateData.description);
      expect(response.data.priority).toBe(updateData.priority);
      expect(response.data.status).toBe(updateData.status);
      expect(response.data.assigneeId).toBe(updateData.assigneeId);
    });

    it('should mark task as completed', async () => {
      const updateData = {
        status: TaskStatus.COMPLETED
      };

      const response = await axios.put(`${baseUrl}/tasks/${createdTaskId}`, updateData, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe(TaskStatus.COMPLETED);
      expect(response.data.completedAt).toBeDefined();
    });

    it('should update only specific fields', async () => {
      const updateData = {
        title: 'Partially Updated Task'
      };

      const response = await axios.put(`${baseUrl}/tasks/${createdTaskId}`, updateData, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      // Other fields should remain unchanged
    });

    it('should return 404 for non-existent task', async () => {
      const updateData = {
        title: 'Non-existent Task'
      };

      try {
        await axios.put(`${baseUrl}/tasks/non-existent-id`, updateData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 404');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        priority: 'invalid-priority',
        status: 'invalid-status'
      };

      try {
        await axios.put(`${baseUrl}/tasks/${createdTaskId}`, invalidUpdateData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      try {
        await axios.put(`${baseUrl}/tasks/${createdTaskId}`, updateData);
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskToDeleteId: string;

    beforeEach(async () => {
      // Create a task for testing deletion
      const taskData = {
        title: 'Task to Delete',
        description: 'This task will be deleted',
        priority: TaskPriority.LOW,
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      const response = await axios.post(`${baseUrl}/tasks`, taskData, {
        headers: getAuthHeaders()
      });
      taskToDeleteId = response.data.id;
    });

    it('should delete a task successfully', async () => {
      const response = await axios.delete(`${baseUrl}/tasks/${taskToDeleteId}`, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent task', async () => {
      try {
        await axios.delete(`${baseUrl}/tasks/non-existent-id`, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 404');
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('should return 401 without authentication', async () => {
      try {
        await axios.delete(`${baseUrl}/tasks/${taskToDeleteId}`);
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('GET /api/v1/tasks/stats', () => {
    it('should fetch task statistics', async () => {
      const response = await axios.get(`${baseUrl}/tasks/stats`, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('completed');
      expect(response.data).toHaveProperty('inProgress');
      expect(response.data).toHaveProperty('todo');
      expect(response.data).toHaveProperty('overdue');
      expect(typeof response.data.total).toBe('number');
      expect(typeof response.data.completed).toBe('number');
      expect(typeof response.data.inProgress).toBe('number');
      expect(typeof response.data.todo).toBe('number');
      expect(typeof response.data.overdue).toBe('number');
    });

    it('should return 401 without authentication', async () => {
      try {
        await axios.get(`${baseUrl}/tasks/stats`);
        fail('Should have returned 401');
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });
  });

  describe('Permission Tests', () => {
    let memberTaskId: string;

    beforeEach(async () => {
      // Create a task as a member for permission testing
      const taskData = {
        title: 'Member Task',
        description: 'Task created by member',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      const response = await axios.post(`${baseUrl}/tasks`, taskData, {
        headers: getAuthHeaders()
      });
      memberTaskId = response.data.id;
    });

    it('should allow members to complete assigned tasks', async () => {
      // First assign the task to the current user
      await axios.put(`${baseUrl}/tasks/${memberTaskId}`, {
        assigneeId: userId
      }, {
        headers: getAuthHeaders()
      });

      // Then mark as complete
      const response = await axios.put(`${baseUrl}/tasks/${memberTaskId}`, {
        status: TaskStatus.COMPLETED
      }, {
        headers: getAuthHeaders()
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe(TaskStatus.COMPLETED);
    });

    it('should prevent members from editing unassigned tasks', async () => {
      const updateData = {
        title: 'Unauthorized Update',
        description: 'This should fail'
      };

      try {
        await axios.put(`${baseUrl}/tasks/${memberTaskId}`, updateData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 403');
      } catch (error: any) {
        expect(error.response?.status).toBe(403);
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate task priority values', async () => {
      const invalidTaskData = {
        title: 'Invalid Priority Task',
        description: 'Task with invalid priority',
        priority: 'invalid-priority',
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      try {
        await axios.post(`${baseUrl}/tasks`, invalidTaskData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate task status values', async () => {
      const invalidTaskData = {
        title: 'Invalid Status Task',
        description: 'Task with invalid status',
        priority: TaskPriority.MEDIUM,
        status: 'invalid-status',
        organizationId: organizationId
      };

      try {
        await axios.post(`${baseUrl}/tasks`, invalidTaskData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate required fields', async () => {
      const incompleteTaskData = {
        description: 'Task without title',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        organizationId: organizationId
      };

      try {
        await axios.post(`${baseUrl}/tasks`, incompleteTaskData, {
          headers: getAuthHeaders()
        });
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        axios.get(`${baseUrl}/tasks`, {
          headers: getAuthHeaders()
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    it('should handle large task lists efficiently', async () => {
      const startTime = Date.now();
      
      const response = await axios.get(`${baseUrl}/tasks`, {
        headers: getAuthHeaders()
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});
