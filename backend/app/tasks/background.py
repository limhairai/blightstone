from fastapi import BackgroundTasks
from typing import Callable, Any, Dict
import asyncio
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    def __init__(self):
        self.tasks: Dict[str, asyncio.Task] = {}

    async def add_task(self, task_id: str, func: Callable, *args, **kwargs) -> None:
        """Add a background task."""
        if task_id in self.tasks:
            logger.warning(f"Task {task_id} already exists")
            return

        try:
            task = asyncio.create_task(func(*args, **kwargs))
            self.tasks[task_id] = task
            logger.info(f"Added background task {task_id}")
        except Exception as e:
            logger.error(f"Error adding background task {task_id}: {str(e)}")
            raise

    async def cancel_task(self, task_id: str) -> None:
        """Cancel a background task."""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                logger.info(f"Cancelled background task {task_id}")
            del self.tasks[task_id]

    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a background task."""
        if task_id not in self.tasks:
            return {"status": "not_found"}
        
        task = self.tasks[task_id]
        if task.done():
            if task.exception():
                return {"status": "error", "error": str(task.exception())}
            return {"status": "completed"}
        return {"status": "running"}

background_task_manager = BackgroundTaskManager()

def background_task(task_id: str):
    """Decorator for background tasks."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            await background_task_manager.add_task(task_id, func, *args, **kwargs)
        return wrapper
    return decorator 