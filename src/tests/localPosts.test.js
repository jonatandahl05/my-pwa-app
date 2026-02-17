// src/tests/localPosts.test.js

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    loadLocalPosts
} from '../storage/localPosts.js';

beforeEach(() => {
    localStorage.clear();
})

describe('loadLocalPosts', () => {

    it('ska returnera tom array om localStorage är tomt', () => {
        const result = loadLocalPosts();
        expect(result).toEqual([]);
    });
});
//