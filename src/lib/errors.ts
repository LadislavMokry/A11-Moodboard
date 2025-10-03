/**
 * Custom error classes for typed error handling
 */

export class BoardNotFoundError extends Error {
  constructor(message = 'Board not found') {
    super(message);
    this.name = 'BoardNotFoundError';
  }
}

export class BoardOwnershipError extends Error {
  constructor(message = 'You do not have permission to access this board') {
    super(message);
    this.name = 'BoardOwnershipError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ImageNotFoundError extends Error {
  constructor(message = 'Image not found') {
    super(message);
    this.name = 'ImageNotFoundError';
  }
}
