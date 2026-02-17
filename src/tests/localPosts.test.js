// src/tests/localPosts.test.js

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    loadLocalPosts,
    saveLocalPosts,
    addLocalPost,
    deleteLocalPost,
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

describe('saveLocalPosts', () => {

    it('ska spara inlägg till localStorage', () => {
        const posts = [
            { id: '1', title: 'Test', content: 'Innehåll' }
        ];

        saveLocalPosts(posts);

        const raw = localStorage.getItem('blog_posts_v1');
        const saved = JSON.parse(raw);
        expect(saved).toEqual(posts);
    });

    it('ska kunna spara tom array', () => {
        saveLocalPosts([]);

        const raw = localStorage.getItem('blog_posts_v1');
        expect(JSON.parse(raw)).toEqual([]);
    })

    it('ska skriva över tidigare data', () => {
        saveLocalPosts([{ id: '1', title: 'Gammal' }]);
        saveLocalPosts([{ id: '2', title: 'Ny' }]);

        const raw = localStorage.getItem('blog_posts_v1');
        const saved = JSON.parse(raw);
        expect(saved).toHaveLength(1);
        expect(saved[0].title).toBe('Ny');
    });
});

describe('addLocalPost', () => {

    it('ska skapa ett inlägg med rätt titel och innehåll', () => {
        const post = addLocalPost({
            title: 'Min titel',
            content: 'Mitt innehåll',
        });

        expect(post.title).toBe('Min titel');
        expect(post.content).toBe('Mitt innehåll');
    });

    it('ska ge inlägget ett unikt id', () => {
        const post = addLocalPost({ title: 'A', content: 'B' });

        expect(post.id).toBeDefined();
        expect(typeof post.id).toBe('string');
        expect(post.id.length).toBeGreaterThan(0);
    })

    it('ska sätta __local till true', () => {
        const post = addLocalPost({ title: 'A', content: 'B' });

        expect(post.__local).toBe(true);
    });

    it('ska sätta createdAt till en giltig ISO-sträng', () => {
        const before = new Date().toISOString();
        const post = addLocalPost({ title: 'A', content: 'B' });
        const after = new Date().toISOString();

        expect(post.createdAt).toBeDefined();
        // createdAt ska vara mellan before och after
        expect(post.createdAt >= before).toBe(true);
        expect(post.createdAt <= after).toBe(true);
    })

    it('ska lägga nya inlägg FÖRST i listan', () => {
        addLocalPost({ title: 'Första', content: '1' });
        addLocalPost({ title: 'Andra', content: '2' });
        addLocalPost({ title: 'Tredje', content: '3' });

        const posts = loadLocalPosts();
        expect(posts).toHaveLength(3);

        expect(posts[0].title).toBe('Tredje');
        expect(posts[1].title).toBe('Andra');
        expect(posts[2].title).toBe('Första');
    });

    it('ska faktiskt spara till localStorage', () => {
        addLocalPost({ title: 'Sparad', content: 'Data' });

        const raw = localStorage.getItem('blog_posts_v1');
        const saved = JSON.parse(raw);
        expect(saved).toHaveLength(1);
        expect(saved[0].title).toBe('Sparad');
    });

    it('ska ge unika id:n för varje inlägg', () => {
        const post1 = addLocalPost({ title: 'A', content: '1' });
        const post2 = addLocalPost({ title: 'B', content: '2' });

        expect(post1.id).not.toBe(post2.id);
    });
});

describe('deleteLocalPost', () => {

    it('ska ta bort ett inlägg baserat på id', () => {
        const post = addLocalPost({ title: 'Ta bort mig', content: 'X' });

        const remaining = deleteLocalPost(post.id);

        expect(remaining).toHaveLength(0);
    });

    it('ska behålla andra inlägg', () => {
        const post1 = addLocalPost({ title: 'Behåll', content: '1' });
        const post2 = addLocalPost({ title: 'Ta bort', content: '2' });
        const post3 = addLocalPost({ title: 'Behåll också', content: '3' });

        const remaining = deleteLocalPost(post2.id);

        expect(remaining).toHaveLength(2);
        expect(remaining.find(p => p.id === post1.id)).toBeDefined();
        expect(remaining.find(p => p.id === post3.id)).toBeDefined();
        expect(remaining.find(p => p.id === post2.id)).toBeUndefined();
    })

    it('ska uppdatera localStorage efter borttagning', () => {
        const post = addLocalPost({ title: 'Temp', content: 'X' });
        deleteLocalPost(post.id);

        const posts = loadLocalPosts();
        expect(posts).toHaveLength(0);
    })

    it('ska hantera id som nummer (string-jämförelse)', () => {

        const posts = [
            { id: 123, title: 'Nummer-id', content: 'X' }
        ];
        saveLocalPosts(posts);

        const remaining = deleteLocalPost('123');
        expect(remaining).toHaveLength(0);
    });

    it('ska inte krascha om id:t inte finns', () => {
        addLocalPost({ title: 'Finns', content: 'X' });

        const remaining = deleteLocalPost('finns-inte-id');

        expect(remaining).toHaveLength(1);
    });
});