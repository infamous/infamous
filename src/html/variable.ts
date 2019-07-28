const dependenciesOfReactions = new WeakMap<Function, Set<Function>>()
const dependentsOfVariables = new WeakMap<Function, Set<Function>>()

let currentReaction: Function | null = null
let scheduledReactions: Set<Function> = new Set()

function Variable<T>(initialValue: T) {
    let currentValue = initialValue

    function v(): T
    function v(value: T): void
    function v(value?: T): T | void {
        // if the value is being set
        if (arguments.length !== 0) {
            currentValue = value!

            // trigger reactions
            scheduleReactions(dependentsOfVariables.get(v))
        }
        // if the value is being gotten
        else {
            // track dependents of this variable
            if (currentReaction) trackDependency(v, currentReaction)

            return currentValue
        }
    }

    v.once = once.bind(null, v)
    v.changesTo = changesTo.bind(null, v)

    return v
}

function trackDependency(v: Function, reaction: Function) {
    let vars = dependenciesOfReactions.get(reaction)
    if (!vars) dependenciesOfReactions.set(reaction, (vars = new Set()))
    vars.add(v)

    let reactions = dependentsOfVariables.get(v)
    if (!reactions) dependentsOfVariables.set(v, (reactions = new Set()))
    reactions.add(reaction)
}

let areScheduled = false

function scheduleReactions(reactions?: Set<Function>) {
    if (!reactions) return
    for (const reaction of reactions) scheduleReaction(reaction)
}

function scheduleReaction(reaction: Function) {
    scheduledReactions.add(reaction)

    if (areScheduled) return
    areScheduled = true

    Promise.resolve().then(() => {
        areScheduled = false
        runReactions()
    })
}

function runReactions() {
    const reactions = scheduledReactions
    scheduledReactions = new Set()
    for (const reaction of reactions) runReaction(reaction)
}

let reactionToStop: Function = () => {}
const stop = () => removeDependencies(reactionToStop)

function runReaction(reaction: Function) {
    currentReaction = reaction
    removeDependencies(reaction)
    reactionToStop = reaction
    reaction(stop)
    currentReaction = null
}

function removeDependencies(reaction: Function) {
    const dependencies = dependenciesOfReactions.get(reaction)

    // unassociate the current reaction from its dependencies, so that
    // dependencies will be re-calculated when the reaction runs (so that
    // dependencies that are no longer used due to conditional branching won't
    // trigger unnecessary re-runs).
    //
    // TODO what's the performance implication of the iteration here? Is there a
    // better way?
    if (dependencies) {
        for (const v of dependencies) {
            dependencies.delete(v)
            const dependents = dependentsOfVariables.get(v)
            if (dependents) dependents.delete(reaction)
        }
    }
}

export function auto<T extends (stop: () => void) => void>(reaction: T) {
    runReaction(reaction)
}

function once<T>(v: Function, value: T): boolean {
    return changesTo(v, value, true)
}

const changeTos = new WeakMap<Function, any>()

function changesTo<T>(v: Function, value: T, once: boolean = false): boolean {
    let c = changeTos.get(v)

    if (!c) changeTos.set(v, (c = {value, observed: false}))

    if (v() === value && !c.observed) {
        if (!once) {
            Promise.resolve().then(() => {
                Promise.resolve().then(() => {
                    c.observed = false
                })
            })
        }

        c.observed = true
        return true
    }

    return false
}

export function variable<T>(prototype: any, name: any) {
    const v = Variable<T>(undefined!)

    Object.defineProperty(prototype, 'v_' + name, {value: v})

    Object.defineProperty(prototype, name, {
        get(): T {
            return this['v_' + name]()
        },
        set(v: T) {
            this['v_' + name](v)
        },
    })
}

class Test {
    @variable foo = 123
}

async function main() {
    const username = Variable('John')
    const count = Variable(0)

    auto(() => {
        console.log(username())

        if (username.changesTo('mary')) {
            count(count() + 1)
            console.log(count())
        }
    })

    const t = new Test()

    const start = performance.now()
    auto(done => {
        console.log(t.foo)
        if (performance.now() - start > 5000) return done()
    })

    const words = ['mary', 'foo', 'bar']

    setInterval(() => {
        const index = Math.round(Math.random() * (words.length - 1))
        username(words[index])
        t.foo += 1
    }, 1000)
}

main()

// TODO?: support nested computations. For now, we must break them out to
// non-nested separate computations. Not sure if it is worth adding this
// feature, because it is totally possible to achieve the same thing without
// nesting, and thus less complexity. If we do this, we'll need to keep track of
// parent/child relationships between computations. Not sure it is worth it
// honestly. Is there a really good reason that I don't know about?

// TODO better types than Function
