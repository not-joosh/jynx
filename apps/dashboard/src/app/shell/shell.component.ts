import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div class="flex">
        <aside class="hidden md:block w-64 bg-white/80 backdrop-blur border-r min-h-screen">
          <div class="px-4 py-5 text-lg font-semibold">Taskly</div>
          <nav class="px-2 py-2 space-y-1">
            <a routerLink="/tasks" routerLinkActive="bg-gray-100" class="block px-3 py-2 rounded hover:bg-gray-100">Tasks</a>
            <a routerLink="/orgs" routerLinkActive="bg-gray-100" class="block px-3 py-2 rounded hover:bg-gray-100">Organizations</a>
          </nav>
        </aside>

        <div class="flex-1 min-h-screen flex flex-col">
          <header class="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
            <div class="h-14 flex items-center justify-between px-4">
              <div class="md:hidden">
                <span class="font-semibold tracking-tight">Taskly</span>
              </div>
              <div class="flex items-center gap-2">
                <a routerLink="/auth/login" class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Login</a>
                <a routerLink="/auth/register" class="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black">Sign up</a>
              </div>
            </div>
          </header>

          <main class="p-4">
            <router-outlet />
          </main>
        </div>
      </div>
    </div>
  `,
})
export class ShellComponent {}
