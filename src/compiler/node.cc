// Copyright 2013 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "src/compiler/node.h"
#include "src/compiler/graph.h"
#include "src/zone.h"

namespace v8 {
namespace internal {
namespace compiler {

Node::Node(Graph* graph, int input_count, int reserve_input_count)
    : input_count_(input_count),
      reserve_input_count_(reserve_input_count),
      has_appendable_inputs_(false),
      use_count_(0),
      first_use_(NULL),
      last_use_(NULL) {
  DCHECK(reserve_input_count <= kMaxReservedInputs);
  inputs_.static_ = reinterpret_cast<Input*>(this + 1);
  id_ = graph->NextNodeID();
}


Node* Node::New(Graph* graph, int input_count, Node** inputs,
                bool has_extensible_inputs) {
  size_t node_size = sizeof(Node);
  int reserve_input_count = has_extensible_inputs ? kDefaultReservedInputs : 0;
  size_t inputs_size = (input_count + reserve_input_count) * sizeof(Input);
  size_t uses_size = input_count * sizeof(Use);
  int size = static_cast<int>(node_size + inputs_size + uses_size);
  Zone* zone = graph->zone();
  void* buffer = zone->New(size);
  Node* result = new (buffer) Node(graph, input_count, reserve_input_count);
  Input* input =
      reinterpret_cast<Input*>(reinterpret_cast<char*>(buffer) + node_size);
  Use* use =
      reinterpret_cast<Use*>(reinterpret_cast<char*>(input) + inputs_size);

  for (int current = 0; current < input_count; ++current) {
    Node* to = *inputs++;
    input->to = to;
    input->use = use;
    use->input_index = current;
    use->from = result;
    to->AppendUse(use);
    ++use;
    ++input;
  }
  return result;
}


void Node::Kill() {
  DCHECK_NOT_NULL(op());
  RemoveAllInputs();
  DCHECK(uses().empty());
}


void Node::CollectProjections(NodeVector* projections) {
  for (size_t i = 0; i < projections->size(); i++) {
    (*projections)[i] = NULL;
  }
  for (UseIter i = uses().begin(); i != uses().end(); ++i) {
    if ((*i)->opcode() != IrOpcode::kProjection) continue;
    size_t index = OpParameter<size_t>(*i);
    DCHECK_LT(index, projections->size());
    DCHECK_EQ(NULL, (*projections)[index]);
    (*projections)[index] = *i;
  }
}


Node* Node::FindProjection(size_t projection_index) {
  for (UseIter i = uses().begin(); i != uses().end(); ++i) {
    if ((*i)->opcode() == IrOpcode::kProjection &&
        OpParameter<size_t>(*i) == projection_index) {
      return *i;
    }
  }
  return NULL;
}


std::ostream& operator<<(std::ostream& os, const Node& n) {
  os << n.id() << ": " << *n.op();
  if (n.InputCount() > 0) {
    os << "(";
    for (int i = 0; i < n.InputCount(); ++i) {
      if (i != 0) os << ", ";
      os << n.InputAt(i)->id();
    }
    os << ")";
  }
  return os;
}

}  // namespace compiler
}  // namespace internal
}  // namespace v8
