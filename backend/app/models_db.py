from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db import Base

def _now():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    objective = Column(Text, default="")
    constraints = Column(Text, default="")
    resources = Column(Text, default="")
    status = Column(String(50), default="created")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)
    runs = relationship("InvestigationRun", back_populates="project", cascade="all,delete")
    evidences = relationship("Evidence", back_populates="project", cascade="all,delete")
    hypotheses = relationship("Hypothesis", back_populates="project", cascade="all,delete")

class InvestigationRun(Base):
    __tablename__ = "runs"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stage = Column(String(50), default="understanding")
    log = Column(JSON, default=list)
    summary = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_now)
    project = relationship("Project", back_populates="runs")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    kind = Column(String(50), default="observation")
    title = Column(String(300), nullable=False)
    detail = Column(Text, default="")
    source = Column(String(200), default="dataset")
    confidence = Column(Float, default=0.5)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_now)
    project = relationship("Project", back_populates="evidences")

class Hypothesis(Base):
    __tablename__ = "hypotheses"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(300), nullable=False)
    statement = Column(Text, default="")
    confidence = Column(Float, default=0.0)
    support = Column(Integer, default=0)
    contradiction = Column(Integer, default=0)
    impact = Column(Float, default=0.0)
    uncertainty = Column(Float, default=0.5)
    evidence_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=_now)
    project = relationship("Project", back_populates="hypotheses")

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(200), default="scenario")
    params = Column(JSON, default=dict)
    result = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_now)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    action = Column(Text, nullable=False)
    rationale = Column(Text, default="")
    benefit = Column(Float, default=0.0)
    effort = Column(String(20), default="medium")
    risk = Column(String(20), default="medium")
    metric = Column(String(300), default="")
    method = Column(String(300), default="")
    deps = Column(JSON, default=list)
    score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=_now)

class Outcome(Base):
    __tablename__ = "outcomes"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    baseline = Column(Float, default=0.0)
    observed = Column(Float, default=0.0)
    change_pct = Column(Float, default=0.0)
    note = Column(Text, default="")
    verdict = Column(String(100), default="")
    created_at = Column(DateTime, default=_now)
