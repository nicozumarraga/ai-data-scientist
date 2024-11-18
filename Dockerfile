# Use the official Python image as the base
FROM python:3.11-slim

# Install LaTeX dependencies
RUN apt-get update && apt-get install -y \
    texlive \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy project files into the container
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Expose the port (if your app runs on a specific port, like Flask defaults to 5000)
EXPOSE 5000

# Command to run the application
CMD ["python", "backend/main.py"]
