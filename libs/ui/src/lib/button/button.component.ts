import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'challenge-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      @apply px-4 py-2 rounded font-medium transition-colors duration-200;
    }
    .btn-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400;
    }
    .btn-secondary {
      @apply bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100;
    }
    .btn-danger {
      @apply bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() disabled = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() onClick = new EventEmitter<Event>();

  get buttonClasses(): string {
    const baseClasses = 'btn';
    const variantClasses = `btn-${this.variant}`;
    const sizeClasses = this.size === 'sm' ? 'px-2 py-1 text-sm' : 
                       this.size === 'lg' ? 'px-6 py-3 text-lg' : 
                       'px-4 py-2';
    
    return `${baseClasses} ${variantClasses} ${sizeClasses}`;
  }
}
