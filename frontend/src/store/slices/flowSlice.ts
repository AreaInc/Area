import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { 
  type Node, 
  type Edge, 
  type NodeChange, 
  type EdgeChange, 
  type Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges 
} from '@xyflow/react';
import { INITIAL_NODES } from '../../mocks/nodes';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  activeWorkflowId: string | null;
}

const initialState: FlowState = {
  nodes: INITIAL_NODES,
  edges: [],
  activeWorkflowId: null,
};

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    setWorkflow: (state, action: PayloadAction<{ id: string; nodes: Node[]; edges: Edge[] }>) => {
      state.activeWorkflowId = action.payload.id;
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
    },
    clearWorkflow: (state) => {
      state.activeWorkflowId = null;
      state.nodes = [];
      state.edges = [];
    },
    nodesChange: (state, action: PayloadAction<NodeChange[]>) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    edgesChange: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    connect: (state, action: PayloadAction<Connection>) => {
      state.edges = addEdge(action.payload, state.edges);
    },
    addNode: (state, action: PayloadAction<Node>) => {
        state.nodes.push(action.payload);
    },
    updateNodeData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
      }
    },
  },
});

export const { 
  setWorkflow, 
  clearWorkflow, 
  nodesChange, 
  edgesChange, 
  connect,
  addNode,
  updateNodeData
} = flowSlice.actions;

export default flowSlice.reducer;
