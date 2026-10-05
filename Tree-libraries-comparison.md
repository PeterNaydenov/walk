# Walk, traverse and Deepdash: three ways to work with nested data

Nested data can turn a small transformation into a stack of loops. A tree walking library lets you describe the change once and apply it throughout an object: mask sensitive values, remove unwanted branches, build a transformed copy, or collect information without copying anything.

This article compares **Walk**, **traverse** and **Deepdash** through those tasks. In our local measurements, Walk took the least time in every case that completed. With Walk's default navigation and cycle settings, the competitors took approximately **1.9–8.9 times as long**. Their APIs offer different traversal controls, however, so speed is only part of the choice.

This article covers **Walk v7**. **Measured on 3 October 2026**, the timings come from a development snapshot taken before the v7 release. The competitors were `traverse@0.6.11` and `deepdash@5.3.9`, using Deepdash's standalone entry point with `lodash@4.18.1` installed. The results describe those implementations, workloads and runtime. `FINISH` was added after the measurements; its v7 API is described below, while the timing table retains the measured snapshot identified by its source fingerprint.

## What each library offers

Walk keeps its API around one function and two optional callbacks. `keyCallback` handles leaf values; `objectCallback` handles objects and arrays. Both can return replacements during the copy. `IGNORE()` removes a value or branch, and `PASS()` skips key callbacks on the current container while allowing nested containers to receive their normal callbacks. Set `settings.copy:false` to inspect the data without building a result. `FINISH` stops early, either immediately or after key callbacks process a selected final branch. See the [Walk documentation](README.md).

traverse exposes operations such as `.map()`, `.forEach()` and `.reduce()`. Its visitor receives traversal controls through `this`, including paths, parent context, replacement and removal. It also provides hooks around visiting children. This gives a visitor more direct control over traversal. See the [official traverse documentation](https://github.com/ljharb/js-traverse).

Deepdash provides a broader collection of named operations, including `eachDeep`, `mapValuesDeep`, `filterDeep`, `findDeep`, `pickDeep` and `omitDeep`. It works standalone or as a Lodash extension. This is convenient when the operation you need already has a dedicated method. See the [official Deepdash documentation](https://deepdash.io/).

| Task or capability | Walk v7 | traverse 0.6.11 | Deepdash 5.3.9 |
| --- | --- | --- | --- |
| Copy while changing values | `walk` with `keyCallback` | `.map()` | `mapValuesDeep` |
| Remove whole branches | `objectCallback` returns `IGNORE()` | `this.remove(true)` in `.map()` | `filterDeep` |
| Inspect without building a copy | `settings.copy:false` | `.forEach()` without updates | `eachDeep` |
| Navigation information | Breadcrumb string and read-only parent path; individually optional | Full path array and parent context | Path and parent context |
| Visit after children | No dedicated hook | `this.after()` / `this.post()` | `eachDeep` with `callbackAfterIterate:true` |
| Select child collections by configuration | Write a callback rule | Write a visitor rule | `childrenPath` option |
| Search and reduction | Collect or accumulate in a callback | `.reduce()` and visitor logic | Dedicated find, some and reduce methods |
| Circular reference detection | On by default; `detectCycles:false` disables it | Ancestor detection during traversal | `checkCircular:true` enables it |

The traverse entries follow its [documented visitor API](https://github.com/ljharb/js-traverse). Deepdash's traversal options and defaults are described in its [eachDeep documentation](https://deepdash.io/#eachdeep) and [implementation](https://github.com/YuriGor/deepdash/blob/master/getEachDeep.js). The benchmark used the installed versions above; online documentation may describe a different release.

## The same transformation, three API styles

Consider a structure containing numbers at different depths:

```js
let data = { count:1, items:[{ score:2 },{ score:3 }] };
```

We want a new structure with every number increased by one, leaving `data` unchanged.

With Walk, the callback returns the desired leaf value:

```js
import walk from '@peter.naydenov/walk'

let result = walk ({
                          data
                        , keyCallback : ({ value }) => typeof value === 'number' ? value + 1 : value
                    })
```

With traverse, the visitor updates the copied node through its context. Use a regular function here so the library can supply `this`:

```js
const traverse = require ( 'traverse' )

let result = traverse ( data ).map ( function ( value ) {
                                  if ( typeof value === 'number' )   this.update ( value + 1 )
                              })
```

With Deepdash, choose a mapping operation and specify which values it visits:

```js
const deep = require ( 'deepdash/standalone' )

let result = deep.mapValuesDeep (
                      data
                    , value => typeof value === 'number' ? value + 1 : value
                    , { leavesOnly:true, checkCircular:true }
                )
```

Each example produces `{ count:2, items:[{ score:3 },{ score:4 }] }`. The snippets illustrate the [traverse mapping API](https://github.com/ljharb/js-traverse) and [Deepdash mapping API](https://deepdash.io/#mapvaluesdeep). They do not imply identical behaviour for every JavaScript value. In particular, the benchmark's Deepdash adapter explicitly creates fresh empty containers when its leaf mapper encounters an empty object or array.

## Where Walk's controls make a difference

Walk can remove an expensive branch before visiting its contents:

```js
let result = walk ({
                          data
                        , objectCallback : ({ value, key, IGNORE }) => key === 'metadata' ? IGNORE() : value
                    })
```

`PASS()` solves a different problem. Imagine a large array of simple values that should be copied unchanged, while objects nested inside it still need processing. Returning `PASS()` for that array skips its immediate leaf callbacks. Nested objects still receive `objectCallback`, and their leaf callbacks resume normally. `PASS(replacement)` applies the same rule to a replacement value.

That local behaviour is distinct from pruning an entire subtree. `IGNORE()` drops the branch; `PASS()` keeps it and selectively avoids callback work. This can make Walk useful when a transformation applies to only part of a large structure.

`FINISH` handles jobs that end early, such as finding the first matching record. Both callbacks receive it, and its instruction must be returned. `FINISH()` stops immediately, omitting the current value. From an object callback, `FINISH(value)` selects a final branch: its key callbacks receive `isFinished:true`, including nested leaves, with no further object callbacks. From a key callback, `FINISH(value)` includes the supplied value directly and stops immediately. With copying enabled, finishing returns a partial result; without copying, collect the match externally and walk still returns `undefined`. The benchmark did not measure early finishing.

The settings provide another way to avoid unnecessary work:

```js
let total = 0;

walk ({
              data
            , settings : { copy:false, breadcrumbs:false, parentPath:false }
            , keyCallback : ({ value }) => {
                                  if ( typeof value === 'number' )   total += value
                              }
        })
```

This call builds no result structure or path arguments. Circular reference detection stays enabled. It returns `undefined`; the collected information lives in `total`. Callbacks can still mutate objects they receive, so preserving the source also depends on how the callbacks are written.

## What we measured

The benchmark used three deliberately different shapes:

| Shape | Contents | What it exercises |
| --- | --- | --- |
| Flat object | 1,000,000 numeric properties | Many keys in one container |
| Nested records | 100,000 records, each with `id`, `name`, nested `metadata`, and a `tags` array | Many small containers and useful branch pruning |
| Deep chain | 4,000 nested `child` properties above `{ leaf:1 }` | Depth, path preparation and traversal limits |

The records contained 600,000 leaf values and 300,001 containers. Their exact structure was:

```js
{ id, name:'item', metadata:{ active:true, score:id, tags:['a','b'] } }
```

For each shape, the benchmark performed three tasks:

1. **Transform:** create a copy and increase every number by one.
2. **Prune:** create a copy without properties named `metadata` or their descendants.
3. **Scan:** count and sum numeric values without creating a copy.

Only the records contain `metadata`. For the flat object and deep chain, the prune task therefore measures copying with a branch predicate that removes nothing.

There were two Walk profiles. **Default** kept both path arguments enabled. **Paths off** disabled `breadcrumbs` and `parentPath`. Both kept cycle detection enabled. Scan additionally disabled copying in both profiles.

## Results

These are median elapsed times in **milliseconds per complete operation**. Lower is better.

| Shape | Task | Walk default | Walk paths off | traverse | Deepdash |
| --- | --- | ---: | ---: | ---: | ---: |
| Flat object | Transform | 309.065 | 293.121 | 785.600 | 732.403 |
| Flat object | Prune predicate; no matching branches | 282.111 | 273.316 | 785.666 | 777.537 |
| Flat object | Scan | 222.858 | 212.263 | 422.127 | 600.242 |
| Nested records | Transform | 119.726 | 78.553 | 515.777 | 371.829 |
| Nested records | Prune metadata | 42.287 | 32.251 | 357.255 | 184.828 |
| Nested records | Scan | 89.108 | 56.598 | 226.922 | 283.950 |
| Deep chain | Transform | 7.488 | 0.624 | Failed¹ | 66.055 |
| Deep chain | Prune predicate; no matching branches | 7.832 | 0.908 | Failed¹ | 66.867 |
| Deep chain | Scan | 7.385 | 0.603 | Failed² | 65.841 |

¹ traverse's `.map()` threw `TypeError: iterator must be a function` on this deep input.  
² traverse's `.forEach()` threw `RangeError: Maximum call stack size exceeded`.

These failures were reproduced in separate Node processes. They describe this version, runtime and input, rather than a universal maximum depth for traverse. Failed cases have no timing or speed ratio.

On nested records, the default Walk transform took about **120 ms**, compared with **516 ms** for traverse and **372 ms** for Deepdash. Pruning metadata took **42 ms**, **357 ms** and **185 ms**, respectively. In that pruning test, traverse took 8.45 times Walk's elapsed time and Deepdash took 4.37 times its elapsed time.

The flat scan was the closest comparison: traverse took 1.89 times the default Walk time. Across every successful comparison with default Walk, the competitor-to-Walk elapsed-time ratio ranged from 1.89 to 8.92.

Path settings mattered most in the deep chain. Walk's transform fell from 7.488 ms to 0.624 ms when both paths were disabled. A chain has few siblings and increasingly long paths, so it exposes a cost that is less visible in a flat object. This is a reason to disable unused navigation arguments, rather than a prediction that every application will gain the same factor.

## How the comparison was kept useful

Measurements used **Node v26.10.0 on macOS arm64, Apple M3 Max**. Each library/task/shape combination had two warmup calls and five measured samples. Execution order rotated between libraries. Deep-chain samples averaged five operations; the other samples measured one operation. Explicit garbage collection ran between measurements, outside the timer. Normal garbage collection during an operation remained part of its time.

Input construction, imports and correctness checks were outside the timed region. Before timing, copying results were checked for expected keys and values, array types and lengths, and fresh containers. The scan's count and sum were checked separately. Input summaries were checked for changes. A small fixture also checked empty containers and branch removal.

Cycle checks were enabled for all three libraries. Deepdash used `checkCircular:true`, overriding its default, together with `pathFormat:'array'` and `includeRoot:true`. These are equivalent tasks, **not identical callback counts or metadata**: Walk separates container and leaf callbacks, traverse visits every node, and Deepdash uses different methods and options for each task. The scan accumulates a count and sum, so traversal order does not affect its result.

The samples showed some variation. For example, default Walk's flat transform ranged from 303.764 to 361.290 ms; traverse ranged from 785.146 to 788.620 ms, and Deepdash from 718.438 to 761.944 ms. Five samples on one machine support a local comparison, not a performance guarantee.

This experiment used plain objects and dense arrays without cycles or shared references. It measured the cost of enabled cycle checking on acyclic data, not performance on cyclic graphs. It did not measure memory consumption, sparse arrays, custom prototypes, built-in object cloning, asynchronous callbacks, or application-specific callback work. It also did not compare pure cloning tools such as `structuredClone`; those answer a different question from transformation during traversal.

## Which library fits which work?

**Walk fits copy-and-transform pipelines well.** Its two callbacks cover masking, branch filtering, replacement and collection with a small API. Local `PASS()` control and optional paths let developers avoid work they do not need. In this experiment, it combined those controls with the shortest measured execution times.

There are limits to its copying contract. Walk creates new object and array containers, but supported built-in values such as dates, maps, sets and typed arrays keep their original references. Custom prototypes, property descriptors, non-enumerable properties and symbol keys are not preserved. A copied result remains editable. Use its [copying rules](README.md#what-gets-copied) to decide whether that matches the data.

**traverse fits visitors that need child hooks and parent context.** **Deepdash fits code that benefits from dedicated deep operations and configured child collections.** Their additional controls can matter more than the measured time difference. Consult the [traverse visitor documentation](https://github.com/ljharb/js-traverse) and [Deepdash traversal documentation](https://deepdash.io/#eachdeep) for those contracts.

For AST work, consider visitation order before comparing speed. Walk queues container contents; its scheduling differs from a depth-first visitor, and it has no dedicated callback after all children have completed. It can inspect or transform an AST represented by ordinary objects and arrays, but parent results that depend on completed child results need additional logic. None of the tasks here measured AST processing or language-specific semantics.

The useful conclusion is specific: **the measured Walk v7 snapshot competed strongly on these large copy, filter and scan workloads, including with its default navigation arguments enabled.** Choose it when its callback model and copying rules match the job; repeat the measurements with your own data when performance is a deciding factor.

## Repeating the experiment

The complete script below preserves the adapters, input generators, checks and measurement loop used for the table. It accepts the Walk source path as a command-line argument and writes `results.json` beside the script, including individual samples, ranges, versions and a Walk source fingerprint.

Create a separate temporary directory, save the script there as `benchmark.mjs`, and install its dependencies there:

```sh
npm init -y
npm install --no-save --package-lock=false --ignore-scripts --no-audit --no-fund traverse@0.6.11 deepdash@5.3.9 lodash@4.18.1
node --expose-gc benchmark.mjs /absolute/path/to/git-walk/src/main.js
```

The measured Walk source fingerprint was `a4cd9caa280da8b0b5fe8c9adfa3229b749f488fad0e152da07838e01ace1829`. It hashes the sorted `src/*.js` filenames and their contents. The working tree was unreleased at the time of measurement, so the fingerprint identifies the implementation more precisely than the package version. Transitive dependency versions are not locked by these commands; save a lockfile and the emitted results if maintaining a long-term benchmark.

<details>
<summary>Complete benchmark script</summary>

```js
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const walkEntry = resolve(process.argv[2]);
const { default: walk } = await import(pathToFileURL(walkEntry).href);
const require = createRequire(import.meta.url);
const traverse = require('traverse');
const deep = require('deepdash/standalone');
const versions = Object.fromEntries(['traverse','deepdash','lodash'].map(name => [name,JSON.parse(readFileSync(new URL('./node_modules/'+name+'/package.json',import.meta.url),'utf8')).version]));
const walkSource=dirname(walkEntry)+'/';
const sourceHash=createHash('sha256');
for(const name of readdirSync(walkSource).sort())if(name.endsWith('.js'))sourceHash.update(name).update(readFileSync(walkSource+name));
const environment={node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,versions,walk:'v7 source snapshot',walkSourceSha256:sourceHash.digest('hex'),warmups:2,samples:5,cycleChecks:true};
const options={checkCircular:true,pathFormat:'array',includeRoot:true};
const increment=value=>typeof value==='number'?value+1:value!==null&&typeof value==='object'?(Array.isArray(value)?[]:{}):value;
const functions={
 'Walk default':{
  transform:data=>walk({data,keyCallback:({value})=>increment(value)}),
  prune:data=>walk({data,objectCallback:({value,key,IGNORE})=>key==='metadata'?IGNORE():value}),
  scan:data=>{let count=0,sum=0;walk({data,settings:{copy:false},keyCallback:({value})=>{if(typeof value==='number'){count++;sum+=value;}}});return{count,sum};}
 },
 'Walk paths off':{
  transform:data=>walk({data,settings:{breadcrumbs:false,parentPath:false},keyCallback:({value})=>increment(value)}),
  prune:data=>walk({data,settings:{breadcrumbs:false,parentPath:false},objectCallback:({value,key,IGNORE})=>key==='metadata'?IGNORE():value}),
  scan:data=>{let count=0,sum=0;walk({data,settings:{copy:false,breadcrumbs:false,parentPath:false},keyCallback:({value})=>{if(typeof value==='number'){count++;sum+=value;}}});return{count,sum};}
 },
 'traverse':{
  transform:data=>traverse(data).map(function(value){if(typeof value==='number')this.update(value+1);}),
  prune:data=>traverse(data).map(function(){if(this.key==='metadata')this.remove(true);}),
  scan:data=>{let count=0,sum=0;traverse(data).forEach(function(value){if(typeof value==='number'){count++;sum+=value;}});return{count,sum};}
 },
 'Deepdash':{
  transform:data=>deep.mapValuesDeep(data,increment,{...options,leavesOnly:true}),
  prune:data=>deep.filterDeep(data,(value,key)=>key!=='metadata',{...options,leavesOnly:false,onTrue:{skipChildren:false,cloneDeep:false,keepIfEmpty:true}}),
  scan:data=>{let count=0,sum=0;deep.eachDeep(data,value=>{if(typeof value==='number'){count++;sum+=value;}},{...options,leavesOnly:true});return{count,sum};}
 }
};
function makeData(shape){
 if(shape==='flat'){const data={};for(let i=0;i<1000000;i++)data['key'+i]=i;return data;}
 if(shape==='records')return Array.from({length:100000},(_,id)=>({id,name:'item',metadata:{active:true,score:id,tags:['a','b']}}));
 let data={leaf:1};for(let i=0;i<4000;i++)data={child:data};return data;
}
function summarize(data){
 let count=0,sum=0,containers=0,leaves=0;
 const pending=[data];
 for(let i=0;i<pending.length;i++){
  const value=pending[i];pending[i]=undefined;
  if(value!==null&&typeof value==='object'){containers++;for(const key of Object.keys(value))pending.push(value[key]);}
  else{leaves++;if(typeof value==='number'){count++;sum+=value;}}
 }
 return{count,sum,containers,leaves};
}
function verifyCopy(input,output,task){
 const pending=[[input,output]];
 for(let i=0;i<pending.length;i++){
  const [original,result]=pending[i];pending[i]=undefined;
  if(original!==null&&typeof original==='object'){
   assert.notEqual(original,result,'source container reused');
   assert.equal(Array.isArray(result),Array.isArray(original));
   const keys=Object.keys(original).filter(key=>task!=='prune'||key!=='metadata');
   assert.deepEqual(Object.keys(result),keys,'result keys differ');
   if(Array.isArray(original))assert.equal(result.length,original.length);
   for(const key of keys)pending.push([original[key],result[key]]);
  }else assert.equal(result,task==='transform'?increment(original):original,'leaf result differs');
 }
}
// Check adapters on a small fixture, including empty containers and removed branches.
const fixture={number:1,metadata:{number:2},empty:{},list:[{number:3,metadata:{number:4}}]};
for(const [name,tasks] of Object.entries(functions))for(const task of ['transform','prune','scan']){
 const result=tasks[task](fixture);
 if(task==='scan')assert.deepEqual(result,{count:4,sum:10});else verifyCopy(fixture,result,task);
}
console.log('Adapters produce equivalent results and keep the input intact');
let sink;
const results=[];
function save(){writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify({environment,results},null,2));}
function measure(fn,data,count){const start=performance.now();for(let i=0;i<count;i++)sink=fn(data);return(performance.now()-start)/count;}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
for(const shape of ['flat','records','deep']){
 const data=makeData(shape),original=summarize(data);
 for(const task of ['transform','prune','scan']){
  console.log('Starting '+shape+' / '+task);
  const entries=[];
  for(const [library,tasks] of Object.entries(functions)){
   const fn=tasks[task];
   try{
    sink=fn(data);
    if(task==='scan')assert.deepEqual(sink,{count:original.count,sum:original.sum});else verifyCopy(data,sink,task);
    assert.deepEqual(summarize(data),original,'input changed');
    entries.push({library,fn,samples:[]});
   }catch(error){
    const row={shape,task,library,status:'failed',error:error.name+': '+error.message};
    results.push(row);console.log(JSON.stringify(row));save();
   }
   sink=undefined;global.gc();
  }
  for(let round=0;round<2;round++)for(const entry of entries){sink=entry.fn(data);sink=undefined;global.gc();}
  const count=shape==='deep'?5:1;
  for(let round=0;round<5;round++)for(let offset=0;offset<entries.length;offset++){
   const entry=entries[(round+offset)%entries.length];sink=undefined;global.gc();entry.samples.push(measure(entry.fn,data,count));
  }
  for(const entry of entries){
   const row={shape,task,library:entry.library,status:'ok',medianMs:+median(entry.samples).toFixed(3),rangeMs:[Math.min(...entry.samples),Math.max(...entry.samples)].map(ms=>+ms.toFixed(3)),samplesMs:entry.samples.map(ms=>+ms.toFixed(3)),iterationsPerSample:count};
   results.push(row);console.log(JSON.stringify(row));save();
  }
  sink=undefined;global.gc();
 }
}
console.log('Benchmark complete');
```

</details>
