# Reactive workflow

Workflows are essentially mutation procedures which have two additional constraints:

1. Steps in the workflow may be blocking or very slow during which other changes happen
2. Steps may be batched across workflow instances.

Representing mutations declaratively is difficult enough but both
points above cause particular difficulties

## Workflows as long-running processes

Consider this example simple workflow:

```js
let ticket = CreateTicket();
let priority = TriageTicket(ticket);
let {owner, startTime} = AssignTicket(ticket, {priority}));
let {endTime, status} = ProcessTicket(ticket, {priority, startTime, owner});
return {priority, assignedTo, startTime, endTime, status};
```

Each of the steps here like `CreateTicket` or `TriageTicket` can be
considered slow/long-lived processes and can even require manual
input.

For instance, the `CreateTicket` step may simply be a Form dialog.

These may even be scheduled on different machines. Maybe QA or Support
folks batch run the `CreateTicket` setup, while Triage people run the
`TriageTicket` process.  In other words, these functions may simply
require manual action to complete but as far as the code is concerned
this is just another long running call.

## Queues as views of all running "processes"

Consider an instance of the example above that is stuck in the
AssignTicket step.

A view that lists all processes stuck at that step would essentially
simply be a table of all arguments to that blocking step.  The manual
step of assigning a "owner" can be thought of as a Triage person
picking an item off (maybe sorting by priority) and then "returning"
the "(owner, startTime)" tuple.

This approach allows for a lot of natural code-related tools to play
out well.  For instance, one can talk of complexity measures, code
coverage, profiling for performance etc quite well.  All the queues
needed naturally fall out of this (all processes stuck waiting for
response is in a "queue").

Another benefit of modeling it like so is the ability to describe
forms inline -- maybe  the `CreateTicket` function can take a HTML
form as input and anyone who looks at those processes has to fill the
form to unblock that process.  This also provides a natural way to do
permissions inline.

## Where are the state variables stored

The next question is to figure out where the state variables
go. Simple variables  that are only used within a single workflow can
simply be stored in a table for all workflow instances of that
workflow.

As with all data, any variable that is shared between workflows
(such as Priority) are better stored in some state available off the
underlying object (which is a `Ticket` in this example).

## Shared mutable variables

This raises some thorny issues with respect to reactivity:

```js
  ticket.snippet = summarize(ticket.message)
```

Consider a step like the above -- where a field is mutated based on
other fields.  The question is what happens to the field `snippet` if
the `ticket.message` changes after this assignment.  In a fully
reactive world, it would effectively track the underlying value and
recompute.

There is a second angle to reactivity:

```js
   if (ticket.priority > 2) {
      {owner, startTime} AssignLowPriorityTicket(ticket);
   } else {
      {owner, startTime} = AssignTicket(ticket);
   }
```

In the example above, consider a workflow instance that is blocked on
user input for `AssignLowPriorityTicket`.  If, meanwhile (or even
after), the priority is set to `1`, would the task be switched from
the `AssignLowPriorityTicket` to `AssignTicket`?  In an ideal reactive
world, this would be the intent but the difficulty is how many such
steps back should there be a "virual" rollback?  One approach is to
limit all rollbacks to never rollback a blocking action but this seems
arbitrary.

A slightly better model is to use `when` for reactive checks:

```js
   when {
     ticket.priority > 2 : {owner, startTime} = AssignLowPriority...,
     else: ....
   }
```

This basically makes `when` clauses reactive with all actions within
rolled back if the priority changes.  An imperative setup is to use
transactions for it:

```js

const priority = beginTransaction(ticket.priority);
// if priority changes and the transaction has not been committed, it
// will rollback to here again

....
endTransaction();
```

It is also not clear if rollbacks should force all edits to
rollback. While this is possible technically with OT, this seems
undesirable. An approach is to consider the rollback of only control
flow and local variables with all shared state left as is.

## Alternate formulation

An alternate more reactive formulation would be using filters and only
shared state:


```js
  tickets = CreateTicketsQueue();

  // filter for priority and for each match, set priority to TriageTicket(it)
  tickets.filter(it.priority == nil).map(it.extend({
    priority: TriageTicket(it)
  }))

  // similarly do for assignment
  tickets.filter(it.owner == nil && it.priority == nil).map(it.extend({
    owner: AssignTicket(it)
  }))

  // similarly do for processing ticket
  tickets.filter(it.endTime == nil && it.owner == nil).map(it.extend({
    endTime: ProcessTicket(it)
  }))

```

This formulation is definitely much easier to implement and reason
about but in practice, this is not simple to author.  A better
approach may be to transpile the first formulation into some version
of this formulation.


