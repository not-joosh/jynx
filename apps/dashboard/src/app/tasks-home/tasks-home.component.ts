import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p class="mt-2 text-gray-600">Welcome back! Here's what's happening with your tasks today.</p>
          </div>
          <button class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Task
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Tasks</p>
              <p class="text-2xl font-semibold text-gray-900">24</p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Completed</p>
              <p class="text-2xl font-semibold text-gray-900">18</p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">In Progress</p>
              <p class="text-2xl font-semibold text-gray-900">4</p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Organizations</p>
              <p class="text-2xl font-semibold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Recent Tasks -->
        <div class="lg:col-span-2">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">Design new landing page</p>
                      <p class="text-sm text-gray-500">Due tomorrow</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">In Progress</span>
                </div>

                <div class="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">Update user documentation</p>
                      <p class="text-sm text-gray-500">Completed yesterday</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Completed</span>
                </div>

                <div class="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">Review pull requests</p>
                      <p class="text-sm text-gray-500">Due next week</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions & Organizations -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div class="p-6">
              <div class="space-y-3">
                <button class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Create new organization
                </button>
                <button class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Invite team members
                </button>
                <button class="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View all tasks
                </button>
              </div>
            </div>
          </div>

          <!-- Organizations -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-200 px-6 py-4">
              <h2 class="text-lg font-semibold text-gray-900">Your Organizations</h2>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <span class="text-sm font-semibold text-blue-600">AC</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">Acme Corp</p>
                    <p class="text-sm text-gray-500">12 members</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <span class="text-sm font-semibold text-green-600">TC</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">TechCo</p>
                    <p class="text-sm text-gray-500">8 members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TasksHomeComponent {}
