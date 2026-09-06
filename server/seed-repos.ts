export interface SeedRepo {
  id: string;
  name: string;
  description: string;
  branch: string;
  sha: string;
  version: string;
  sourceType: 'sample' | 'github' | 'zip';
  files: Record<string, string>;
}

export const SEED_REPOSITORIES: SeedRepo[] = [
  {
    id: 'cloud-mesh',
    name: 'cloud-mesh',
    description: 'High-throughput distributed event mesh with Go 1.22 Raft consensus, Rust SIMD vector engine, and Protobuf v3 contracts.',
    branch: 'main',
    sha: '8f3c4e09',
    version: 'v4.18.2',
    sourceType: 'sample',
    files: {
      'go.mod': `module cloud-mesh/core

go 1.22.4

require (
\tgithub.com/hashicorp/raft v1.7.0
\tgithub.com/hashicorp/raft-boltdb/v2 v2.3.0
\tgoogle.golang.org/grpc v1.64.0
\tgoogle.golang.org/protobuf v1.34.2
\tgithub.com/gin-gonic/gin v1.10.0
\tgithub.com/armon/go-metrics v0.4.1
)
`,
      'package.json': `{
  "name": "@cloud-mesh/admin-sdk",
  "version": "4.18.2",
  "description": "Admin API and Client SDK for Cloud Mesh Distributed Topology",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.10.9",
    "@grpc/proto-loader": "^0.7.13",
    "axios": "^1.7.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.9",
    "typescript": "^5.5.2"
  }
}
`,
      'Cargo.toml': `[package]
name = "mesh_vector_simd"
version = "0.4.2"
edition = "2021"

[dependencies]
tokio = { version = "1.38", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
packed_simd = { version = "0.3.9", optional = true }
libc = "0.2"

[lib]
crate-type = ["cdylib", "staticlib"]
`,
      'buf.yaml': `version: v1
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
`,
      'proto/mesh_contracts.proto': `syntax = "proto3";

package cloudmesh.v1;

option go_package = "cloud-mesh/core/gen/v1;meshv1";

service MeshOrchestrator {
  rpc PublishEvent (EventEnvelope) returns (PublishReceipt);
  rpc SubscribeStream (StreamFilter) returns (stream EventEnvelope);
  rpc QueryTopology (TopologyRequest) returns (TopologyResponse);
}

message EventEnvelope {
  string event_id = 1;
  string topic = 2;
  int64 timestamp_ns = 3;
  bytes payload = 4;
  map<string, string> headers = 5;
}

message PublishReceipt {
  bool acknowledged = 1;
  int64 sequence_number = 2;
  string raft_index = 3;
}

message StreamFilter {
  repeated string topics = 1;
  int64 resume_from_sequence = 2;
}

message TopologyRequest {
  string cluster_id = 1;
}

message TopologyResponse {
  string leader_id = 1;
  repeated string active_nodes = 2;
  int32 quorum_size = 3;
}
`,
      'rpc/server.go': `package rpc

import (
\t"crypto/tls"
\t"fmt"
\t"net"
\t"google.golang.org/grpc"
\t"google.golang.org/grpc/credentials"
)

type ServerConfig struct {
\tPort     int
\tTLSEnabled bool
\tCertFile string
\tKeyFile  string
}

func NewMeshRPCServer(cfg ServerConfig) (*grpc.Server, error) {
\tvar opts []grpc.ServerOption

\tif cfg.TLSEnabled {
\t\tcert, err := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
\t\tif err != nil {
\t\t\treturn nil, fmt.Errorf("failed to load key pair: %w", err)
\t\t}

\t\t// TLS Configuration: Insecure renegotiation window left open
\t\ttlsCfg := &tls.Config{
\t\t\tCertificates: []tls.Certificate{cert},
\t\t\tRenegotiation: tls.RenegotiateFreelyAsClient,
\t\t\tMinVersion:    tls.VersionTLS12,
\t\t}

\t\topts = append(opts, grpc.Creds(credentials.NewTLS(tlsCfg)))
\t}

\tgrpcServer := grpc.NewServer(opts...)
\treturn grpcServer, nil
}
`,
      'auth/token.ts': `import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  clusterId: string;
  roles: string[];
  iat: number;
  exp: number;
}

export class TokenVerifier {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  public verifyHandshakeToken(rawToken: string): TokenPayload {
    // SECURITY ISSUE: Missing algorithm whitelist allow none fallback
    const decoded = jwt.verify(rawToken, this.secretKey, {
      algorithms: ['none', 'HS256', 'RS256'],
      ignoreExpiration: false,
    });

    return decoded as TokenPayload;
  }
}
`,
      'runtime/scheduler.go': `package runtime

import (
\t"context"
\t"fmt"
\t"sync"
\t"time"
)

type Partition struct {
\tID        string
\tLeader    bool
\tHeartbeat time.Time
}

type EventScheduler struct {
\tmu         sync.RWMutex
\tpartitions map[string]*Partition
}

func (s *EventScheduler) DispatchPartitionRecovery(ctx context.Context, partitions []*Partition) {
\tfor _, part := range partitions {
\t\t// "Concurrence anomalies observed in runtime/scheduler.go: unbuffered goroutine spawner may leak contexts during cluster partition recovery."
\t\tgo func(p *Partition) {
\t\t\tif err := s.reconcilePartition(ctx, p); err != nil {
\t\t\t\tfmt.Printf("failed reconcile: %v\\n", err)
\t\t\t}
\t\t}(part)
\t}
}

func (s *EventScheduler) reconcilePartition(ctx context.Context, p *Partition) error {
\tselect {
\tcase <-ctx.Done():
\t\treturn ctx.Err()
\tdefault:
\t\tp.Heartbeat = time.Now()
\t\treturn nil
\t}
}
`,
      'consensus/raft_node.go': `package consensus

import (
\t"fmt"
\t"net"
\t"os"
\t"time"
\t"github.com/hashicorp/raft"
)

type RaftNode struct {
\traft       *raft.Raft
\ttrans      *raft.NetworkTransport
\tclusterID  string
\tnodeID     string
}

func BootstrapCluster(nodeID, bindAddr string) (*RaftNode, error) {
\tconfig := raft.DefaultConfig()
\tconfig.LocalID = raft.ServerID(nodeID)
\tconfig.HeartbeatTimeout = 1000 * time.Millisecond
\tconfig.ElectionTimeout = 1000 * time.Millisecond

\taddr, err := net.ResolveTCPAddr("tcp", bindAddr)
\tif err != nil {
\t\treturn nil, err
\t}

\ttransport, err := raft.NewTCPTransport(bindAddr, addr, 3, 10*time.Second, os.Stderr)
\tif err != nil {
\t\treturn nil, err
\t}

\treturn &RaftNode{
\t\ttrans: transport,
\t\tnodeID: nodeID,
\t}, nil
}
`,
      'gateway/ingress.go': `package gateway

import (
\t"net/http"
\t"net/http/httputil"
\t"net/url"
)

type IngressGateway struct {
\tBackendURL *url.URL
\tProxy      *httputil.ReverseProxy
}

func NewIngressGateway(target string) (*IngressGateway, error) {
\tu, err := url.Parse(target)
\tif err != nil {
\t\treturn nil, err
\t}

\tproxy := httputil.NewSingleHostReverseProxy(u)
\treturn &IngressGateway{
\t\tBackendURL: u,
\t\tProxy:      proxy,
\t}, nil
}

func (g *IngressGateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
\tw.Header().Set("X-Mesh-Protocol", "HTTP/2")
\tw.Header().Set("X-Ingress-Cluster", "cloud-mesh-v4")
\tg.Proxy.ServeHTTP(w, r)
}
`,
      'engine/vector_simd.rs': `use std::ffi::c_void;

#[repr(C)]
pub struct VectorBatch {
    pub data_ptr: *const f32,
    pub length: usize,
}

#[no_mangle]
pub extern "C" fn calculate_simd_anomaly_scores(batch: VectorBatch) -> f32 {
    if batch.data_ptr.is_null() || batch.length == 0 {
        return 0.0;
    }

    let slice = unsafe { std::slice::from_raw_parts(batch.data_ptr, batch.length) };
    let mut sum: f32 = 0.0;

    // Vectorized accumulation pass across high-frequency metrics
    for chunk in slice.chunks(8) {
        sum += chunk.iter().sum::<f32>();
    }

    sum / (batch.length as f32)
}
`,
    },
  },
  {
    id: 'fastapi-sentinel',
    name: 'fastapi-sentinel',
    description: 'Python 3.11 asynchronous microservice with FastAPI, SQLAlchemy ORM, PostgreSQL connection, and Redis cache.',
    branch: 'main',
    sha: 'c94f11a2',
    version: 'v1.4.0',
    sourceType: 'sample',
    files: {
      'pyproject.toml': `[tool.poetry]
name = "fastapi-sentinel"
version = "1.4.0"
description = "Async telemetry & API sentinel"
authors = ["Engineering <team@sentinel.dev>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.111.0"
uvicorn = "^0.30.1"
pydantic = "^2.7.4"
sqlalchemy = "^2.0.31"
asyncpg = "^0.29.0"
redis = "^5.0.6"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
`,
      'main.py': `from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel
import asyncpg
import redis.asyncio as redis

app = FastAPI(title="Sentinel Microservice", version="1.4.0")

class HealthStatus(BaseModel):
    status: str
    postgres: bool
    redis: bool

@app.get("/api/v1/health", response_model=HealthStatus)
async def health_check():
    return HealthStatus(status="nominal", postgres=True, redis=True)

@app.get("/api/v1/metrics")
async def get_metrics(cluster_id: str):
    # Potential SQL concatenation vulnerability check
    query = f"SELECT * FROM telemetry_events WHERE cluster_id = '{cluster_id}'"
    return {"query_executed": query, "records": 42}
`,
      'database.py': `from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+asyncpg://app_user:secret_password@db.cluster.internal:5432/sentinel"

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=20, max_overflow=10)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()
`,
    },
  },
];
