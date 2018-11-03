_Who has measured the waters in the hollow of his hand, or with the breadth of his hand marked off the heavens?_

# What is this?

This is Hollow, a compile-to-javascript lisp, inspired by [ramdajs](https://ramdajs.com/) and [Clojure](https://clojure.org/), designed for implementing domain logic shared between multiple codebases. The language is meant to be enjoyable to use in the same way clojure is, without being weighed down by features.

It's called Hollow because it's closure-oriented. For more information on why I wrote my own language, check out [Rationale](#rationale) below.

# Usage

```
$ npm install --save-dev hollowjs
$ mkdir -p my_project && cd my_project
$ echo "(ns main) (console.log (for [x (range 2 4)] (inc x)))" > main.hollow
$ ./node_modules/.bin/hollow --target main.hollow > main.js
$ node main.js
>> [3, 4, 5]
```

# Syntax

## Namespaces

## Async

 All functions return values are wrapped in a promise, and all functions `await` their parameters. This allows us to deal with values passed to functions synchronously, while also avoiding annoying refactors from synchronous to asynchronous behavior.

# Rationale

Why another language?

I had this problem: I wanted to write some (mostly) stateless business logic and include it both in my SPA (for speed and responsiveness), and in my python webserver (to ensure validation logic couldn't be circumvented). This use case evolved as I realized that this approach could be convenient too: why maintain two domain models, when I could maintain one and use it in both places?

I originally started on this goal by writing a javascript library I could use in both places. This worked, but... it was still javascript. I wanted something better, so I started looking:

### ClojureScript 

Clojurescript was my first choice. I've loved Clojure since I listened to my first Rich Hickey talk almost four years ago. It seemed like an ideal solution: write once, compile to javascript, run everywhere! But there were some problems:

- In order to use macros and the Clojure ecosystem, you need to compile ClojureScript using Clojure, which means slow startup times. Using something like lumo means you miss out on all kinds of benefits, including macros.
- ClojureScript is different enough from Clojure that it was a pain to use Clojure's libraries in ClojureScript. For example, I couldn't just use `java.lang.String` for my prismatic schemas. Using javascript libraries wasn't any better, because of javascript's heavy reliance on asynchronous primitives, while Clojure's async primitives are more focused on real concurrency.
- Clojure(script) is a **deep** ecosystem. It's oriented to solving many different complex problems, relying heavily on interop with the host language. This is "simple", for sure, but there's a real trade-off against "easy", which is that it's very hard to get going with a non-trivial project. Hot code reloading leaves dangling threads for some libraries, you have to understand var bindings in order to reload state, and you have to figure this stuff out and embrace repl-driven development to avoid slow startup times. On top of this, documentation is generally sparse, so it's hard to figure out what approaches are currently idiomatic, and which might be failed experiments.

It's become clear to me that javascript is a second-class citizen in the Clojure world, and nodejs is almost an afterthought. It's hard to implement a language well on a new host if it's already been designed for the primary host. 

### ParenScript

This is a super promising alternative, since ParenScript does target the browser and nodejs equally. It has a long, proven legacy, since it's a (broad) subset of Common Lisp. My main doubts about Common Lisp are that it doesn't have real immutability, and the syntax is very bulky compared to Clojure; I love literals, and I think I would miss them. 

My real reason though, is that I don't know Lisp, and I don't have time to learn a new language and paradigms. In my experience, that can take 3-6 months to really get to a point where you're not changing your style all the time and creating legacy code. This is also the reason I chose not to use PureScript or Rust.

### Rust

I nearly went this direction; it's very attractive to be able to have nearly unbeatable speed on both server and client out of the box. The tooling is also wonderful. Unfortunately, as with Lisp, I'm completely unfamiliar with the language. In addition, Rust is as far from a simple business-logic-implementation language as you can find; it's completely the wrong abstraction level (although you could probably write macros to get you there!).

### Elm

Again, I nearly went this direction — I love the paradigm, syntax, immutability, tooling, and development workflow. I also have enough experience with the language to be productive relatively quickly. However, because of dead code elimination and having to annotate exported `main` functions, Elm isn't a great fit for a javascript library with many entrypoints. One helpful Elmer on their slack channel pointed me to...

### PureScript

This seems like a great fit for me. Very few runtime dependencies, compiles to node and browser javascript, good interop story. I even got a few chapters into [the book](https://leanpub.com/purescript/read) — until I discovered that some of the examples don't work, maybe because they're out of date. I may still come back to PureScript, but for now, I don't want to learn a new paradigm _and_ deal with outdated documentation and possibly broken tooling.

So, the moral of the story is:

![XKCD: How Standards Proliferate](https://imgs.xkcd.com/comics/standards.png)

I don't expect Hollow to really gain any kind of traction like the languages I mentioned above, but writing a grammar and parser has proven much easier than learning a new language. I also want to note that it's not that I don't want to learn any of the aforementioned languages — I love to learn! My needs are just so minimal, that writing a new language seems like a much lower level of effort than learning a new paradigm, which is important, because I need this tool yesterday.

## Goals

- Minimum useful feature set.
- Accommodate immutable-style programming without too much of a performance penalty.
- Parameterize namespaces to handle runtime in addition to static dependencies. See [namespaces](#namespaces) for more.
- Interoperate with javascript by exporting native javascript data types and standard javascript asynchronous idioms.
- Interoperate with everything else by passing json over a socket.
- Fast compilation times to keep up with a quick development pace.
- Collection-first: treat operations on individual objects as a special case of collection operations rather than the other way around.
-  Async-first: treat synchronous operations as a special case of asynchronous operations rather than the other way around. See [async](#async) for more.
-  Good compiler and runtime errors.

## Non-Goals

- Non-javascript compile targets.
- Every interesting/useful feature ever.
- Blazing fast performance.
- Application development; most code should be data-oriented and farm side effects out to application code.

# Roadmap

[x] Namespaces: parameterized to handle runtime as well as static dependencies, so more like functions that map to files.
[x] Functions with closures (js style)
[ ] Rename variables to avoid modules shadowing calling modules
[ ] Basic immutable data types: string, integer, float, list, dict
[ ] Standard library: use protocols, ala clojure, but ramda-style auto-currying
[ ] Interop via api: expose a json api as another process that can be talked to over a socket. Use success/failure response modes, ala stderr/stdout, with extra granular codes
[x] Fast compiler — probably use rust
[ ] Collection-first
[ ] Async-first: last parameter treated as callback? All functions return promises that can be then'd or awaited?
[x] Good compilation errors, with line numbers
[ ] Good runtime errors
[ ] Loops, conditionals
[ ] Macros
[ ] Argument destructuring
[ ] Repl
