import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sameOrigin} from '../lib/security.ts';
import {isZone,requestZone} from '../lib/zones.ts';
test('only the three named zones are accepted',()=>{
 assert.equal(isZone('zone-1'),true);assert.equal(isZone('zone-2'),true);assert.equal(isZone('zone-3'),true);
 for(const value of [null,'','zone-4','account-id','Zone 1'])assert.equal(isZone(value),false);
 assert.equal(requestZone(new Request('https://example.com',{headers:{'x-logbook-zone':'zone-2'}})),'zone-2');
 assert.equal(requestZone(new Request('https://example.com')),null);
});
test('write requests require the application origin',()=>{
 const url='https://100actsofgood.hifz-helper.app/api/logbook';
 assert.equal(sameOrigin(new Request(url,{headers:{origin:'https://evil.example'}})),false);
 assert.equal(sameOrigin(new Request(url)),false);
 assert.equal(sameOrigin(new Request(url,{headers:{origin:'https://100actsofgood.hifz-helper.app'}})),true);
});
