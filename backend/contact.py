# contact.py
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import logging

# Import models and schemas from app.py
from app import (
    ContactSubmission, 
    ContactSubmissionCreate, 
    ContactSubmissionUpdate,
    SubmissionStatus,
    EnquiryType,
    SessionLocal,
    Base
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ContactService:
    """Service layer for Contact Management operations"""
    
    def __init__(self, db_session: Session = None):
        self.db = db_session if db_session else SessionLocal()
        self._should_close = db_session is None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._should_close:
            self.db.close()
    
    # ============ CRUD Operations ============
    
    def create_submission(self, submission_data: ContactSubmissionCreate) -> Dict[str, Any]:
        """Create a new contact submission with validation"""
        try:
            # Validate contact number (business logic)
            if len(submission_data.contactNumber.strip()) < 5:
                raise ValueError("Contact number must be at least 5 characters")
            
            # Check for duplicate submissions (same name and contact within 24 hours)
            existing = self.db.query(ContactSubmission).filter(
                ContactSubmission.name == submission_data.name,
                ContactSubmission.contact_number == submission_data.contactNumber,
                ContactSubmission.created_at >= datetime.utcnow().replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            ).first()
            
            if existing:
                logger.warning(f"Duplicate submission detected for {submission_data.name}")
                # Could return existing or raise error - business decision
            
            db_submission = ContactSubmission(
                name=submission_data.name,
                contact_number=submission_data.contactNumber,
                location=submission_data.location,
                category=submission_data.category,
                enquiry_type=submission_data.enquiryType,
                message=submission_data.message,
                status=SubmissionStatus.PENDING,
                is_starred=False
            )
            
            self.db.add(db_submission)
            self.db.commit()
            self.db.refresh(db_submission)
            
            logger.info(f"Created submission for {submission_data.name} with ID {db_submission.id}")
            return db_submission.to_dict()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating submission: {str(e)}")
            raise
    
    def get_submission(self, submission_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get a single submission by ID"""
        try:
            submission = self.db.query(ContactSubmission).filter(
                ContactSubmission.id == submission_id
            ).first()
            
            if submission:
                return submission.to_dict()
            return None
            
        except Exception as e:
            logger.error(f"Error fetching submission {submission_id}: {str(e)}")
            raise
    
    def get_submissions(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        enquiry_type: Optional[str] = None,
        sort_by: str = "createdAt",
        sort_order: str = "desc",
        limit: int = 100,
        offset: int = 0,
        include_archived: bool = False
    ) -> List[Dict[str, Any]]:
        """Get submissions with filtering and sorting"""
        try:
            query = self.db.query(ContactSubmission)
            
            # Filter out archived by default
            if not include_archived:
                query = query.filter(ContactSubmission.status != SubmissionStatus.ARCHIVED)
            
            # Search filter
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    or_(
                        ContactSubmission.name.ilike(search_term),
                        ContactSubmission.contact_number.ilike(search_term),
                        ContactSubmission.location.ilike(search_term),
                        ContactSubmission.category.ilike(search_term)
                    )
                )
            
            # Status filter
            if status and status != "all":
                try:
                    status_enum = SubmissionStatus(status)
                    query = query.filter(ContactSubmission.status == status_enum)
                except ValueError:
                    pass
            
            # Enquiry type filter
            if enquiry_type and enquiry_type != "all":
                try:
                    enquiry_enum = EnquiryType(enquiry_type)
                    query = query.filter(ContactSubmission.enquiry_type == enquiry_enum)
                except ValueError:
                    pass
            
            # Sorting
            sort_field_map = {
                "name": ContactSubmission.name,
                "status": ContactSubmission.status,
                "createdAt": ContactSubmission.created_at,
                "contactNumber": ContactSubmission.contact_number
            }
            
            sort_field = sort_field_map.get(sort_by, ContactSubmission.created_at)
            if sort_order.lower() == "asc":
                query = query.order_by(sort_field.asc())
            else:
                query = query.order_by(sort_field.desc())
            
            # Pagination
            query = query.offset(offset).limit(limit)
            
            submissions = query.all()
            return [sub.to_dict() for sub in submissions]
            
        except Exception as e:
            logger.error(f"Error fetching submissions: {str(e)}")
            raise
    
    def update_submission(
        self, 
        submission_id: uuid.UUID, 
        update_data: ContactSubmissionUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update a submission with business logic"""
        try:
            submission = self.db.query(ContactSubmission).filter(
                ContactSubmission.id == submission_id
            ).first()
            
            if not submission:
                return None
            
            # Business logic: Can't update archived submissions
            if submission.status == SubmissionStatus.ARCHIVED:
                raise ValueError("Cannot update archived submissions")
            
            # Apply updates
            field_map = {
                "name": "name",
                "contactNumber": "contact_number",
                "location": "location",
                "category": "category",
                "enquiryType": "enquiry_type",
                "message": "message",
                "status": "status",
                "isStarred": "is_starred",
                "notes": "notes"
            }
            
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                if key in field_map and value is not None:
                    setattr(submission, field_map[key], value)
            
            # Update timestamp
            submission.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(submission)
            
            logger.info(f"Updated submission {submission_id}")
            return submission.to_dict()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating submission {submission_id}: {str(e)}")
            raise
    
    def update_status(self, submission_id: uuid.UUID, new_status: SubmissionStatus) -> Dict[str, Any]:
        """Update submission status with business logic"""
        try:
            submission = self.db.query(ContactSubmission).filter(
                ContactSubmission.id == submission_id
            ).first()
            
            if not submission:
                raise ValueError("Submission not found")
            
            # Business logic: Cannot change status of archived submissions
            if submission.status == SubmissionStatus.ARCHIVED:
                raise ValueError("Cannot change status of archived submissions")
            
            # Business logic: Status flow validation
            valid_transitions = {
                SubmissionStatus.PENDING: [SubmissionStatus.READ, SubmissionStatus.ARCHIVED],
                SubmissionStatus.READ: [SubmissionStatus.RESPONDED, SubmissionStatus.ARCHIVED],
                SubmissionStatus.RESPONDED: [SubmissionStatus.ARCHIVED],
                SubmissionStatus.ARCHIVED: []
            }
            
            if new_status not in valid_transitions.get(submission.status, []):
                raise ValueError(
                    f"Invalid status transition from {submission.status.value} to {new_status.value}"
                )
            
            submission.status = new_status
            submission.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(submission)
            
            logger.info(f"Updated status for submission {submission_id} to {new_status.value}")
            return {
                "id": str(submission.id),
                "status": submission.status.value,
                "updatedAt": submission.updated_at.isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating status for {submission_id}: {str(e)}")
            raise
    
    def toggle_star(self, submission_id: uuid.UUID) -> Dict[str, Any]:
        """Toggle starred status"""
        try:
            submission = self.db.query(ContactSubmission).filter(
                ContactSubmission.id == submission_id
            ).first()
            
            if not submission:
                raise ValueError("Submission not found")
            
            submission.is_starred = not submission.is_starred
            submission.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(submission)
            
            logger.info(f"Toggled star for submission {submission_id}")
            return {
                "id": str(submission.id),
                "isStarred": submission.is_starred
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error toggling star for {submission_id}: {str(e)}")
            raise
    
    def delete_submission(self, submission_id: uuid.UUID) -> bool:
        """Delete a submission"""
        try:
            submission = self.db.query(ContactSubmission).filter(
                ContactSubmission.id == submission_id
            ).first()
            
            if not submission:
                return False
            
            self.db.delete(submission)
            self.db.commit()
            
            logger.info(f"Deleted submission {submission_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting submission {submission_id}: {str(e)}")
            raise
    
    # ============ Bulk Operations ============
    
    def bulk_action(
        self, 
        submission_ids: List[uuid.UUID], 
        action: str
    ) -> Dict[str, Any]:
        """Perform bulk actions with business logic"""
        try:
            if not submission_ids:
                raise ValueError("No submission IDs provided")
            
            # Get all valid submissions
            submissions = self.db.query(ContactSubmission).filter(
                ContactSubmission.id.in_(submission_ids)
            ).all()
            
            if not submissions:
                raise ValueError("No valid submissions found")
            
            affected_count = len(submissions)
            
            # Business logic: Don't allow bulk actions on archived submissions
            archived_ids = [s.id for s in submissions if s.status == SubmissionStatus.ARCHIVED]
            if archived_ids:
                logger.warning(f"Skipping {len(archived_ids)} archived submissions from bulk action")
                submissions = [s for s in submissions if s.status != SubmissionStatus.ARCHIVED]
            
            if not submissions:
                return {
                    "message": "No actionable submissions found (all are archived)",
                    "affected_count": 0,
                    "action": action,
                    "skipped": len(archived_ids)
                }
            
            if action == "delete":
                for sub in submissions:
                    self.db.delete(sub)
                self.db.commit()
                message = f"Deleted {len(submissions)} submissions"
            
            elif action == "archive":
                for sub in submissions:
                    sub.status = SubmissionStatus.ARCHIVED
                    sub.updated_at = datetime.utcnow()
                self.db.commit()
                message = f"Archived {len(submissions)} submissions"
            
            elif action == "mark-read":
                for sub in submissions:
                    if sub.status == SubmissionStatus.PENDING:
                        sub.status = SubmissionStatus.READ
                        sub.updated_at = datetime.utcnow()
                self.db.commit()
                message = f"Marked {len(submissions)} submissions as read"
            
            else:
                raise ValueError(f"Invalid action: {action}")
            
            logger.info(f"Bulk {action} completed for {len(submissions)} submissions")
            return {
                "message": message,
                "affected_count": len(submissions),
                "action": action,
                "skipped": len(archived_ids) if archived_ids else 0
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error in bulk {action}: {str(e)}")
            raise
    
    # ============ Statistics ============
    
    def get_stats(self) -> Dict[str, int]:
        """Get submission statistics"""
        try:
            total = self.db.query(ContactSubmission).count()
            pending = self.db.query(ContactSubmission).filter(
                ContactSubmission.status == SubmissionStatus.PENDING
            ).count()
            read = self.db.query(ContactSubmission).filter(
                ContactSubmission.status == SubmissionStatus.READ
            ).count()
            responded = self.db.query(ContactSubmission).filter(
                ContactSubmission.status == SubmissionStatus.RESPONDED
            ).count()
            archived = self.db.query(ContactSubmission).filter(
                ContactSubmission.status == SubmissionStatus.ARCHIVED
            ).count()
            
            return {
                "total": total,
                "pending": pending,
                "read": read,
                "responded": responded,
                "archived": archived
            }
            
        except Exception as e:
            logger.error(f"Error getting stats: {str(e)}")
            raise
    
    # ============ Additional Business Logic ============
    
    def get_pending_submissions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all pending submissions (for notifications)"""
        submissions = self.db.query(ContactSubmission).filter(
            ContactSubmission.status == SubmissionStatus.PENDING
        ).order_by(ContactSubmission.created_at.desc()).limit(limit).all()
        
        return [sub.to_dict() for sub in submissions]
    
    def get_starred_submissions(self) -> List[Dict[str, Any]]:
        """Get all starred submissions"""
        submissions = self.db.query(ContactSubmission).filter(
            ContactSubmission.is_starred == True
        ).order_by(ContactSubmission.created_at.desc()).all()
        
        return [sub.to_dict() for sub in submissions]
    
    def get_submissions_by_enquiry_type(
        self, 
        enquiry_type: EnquiryType,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get submissions by enquiry type"""
        submissions = self.db.query(ContactSubmission).filter(
            ContactSubmission.enquiry_type == enquiry_type
        ).order_by(ContactSubmission.created_at.desc()).limit(limit).all()
        
        return [sub.to_dict() for sub in submissions]
    
    def archive_old_submissions(self, days: int = 90) -> int:
        """Automatically archive submissions older than specified days"""
        cutoff_date = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        # Subtract days (simple approach)
        from datetime import timedelta
        cutoff_date = cutoff_date - timedelta(days=days)
        
        old_submissions = self.db.query(ContactSubmission).filter(
            ContactSubmission.created_at < cutoff_date,
            ContactSubmission.status != SubmissionStatus.ARCHIVED
        ).all()
        
        for sub in old_submissions:
            sub.status = SubmissionStatus.ARCHIVED
            sub.updated_at = datetime.utcnow()
        
        self.db.commit()
        count = len(old_submissions)
        
        logger.info(f"Archived {count} submissions older than {days} days")
        return count


# ============ Helper Functions for Integration ============

def get_contact_service(db: Session = None) -> ContactService:
    """Get an instance of ContactService"""
    return ContactService(db)


# ============ Example Usage (for testing) ============

if __name__ == "__main__":
    # Test the service
    with ContactService() as service:
        # Get stats
        stats = service.get_stats()
        print(f"Stats: {stats}")
        
        # Get all submissions
        submissions = service.get_submissions(limit=5)
        print(f"Recent submissions: {len(submissions)}")
        
        # Get pending submissions
        pending = service.get_pending_submissions()
        print(f"Pending submissions: {len(pending)}")