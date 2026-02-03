from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "postgresql://username:password@localhost:5432/code_archaeologist"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class RepoAnalysis(Base):
    __tablename__ = "repo_analysis"
    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String, unique=True, index=True, nullable=False)
    modules = Column(Text)
    architecture = Column(Text)
    technical_debt = Column(Text)
    technical_debt_suggestions = Column(Text)
    onboarding_guide = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# To create tables, run: Base.metadata.create_all(bind=engine)
