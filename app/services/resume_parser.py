import PyPDF2
import docx
import re
from typing import Dict, List, Any
import logging
from textblob import TextBlob

logger = logging.getLogger(__name__)

class ResumeParser:
    def __init__(self):
        self.email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        self.phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        
    async def parse_resume(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Parse resume from uploaded file"""
        try:
            # Extract text based on file type
            if filename.endswith('.pdf'):
                text = self._extract_text_from_pdf(file_content)
            elif filename.endswith('.docx'):
                text = self._extract_text_from_docx(file_content)
            elif filename.endswith('.txt'):
                text = file_content.decode('utf-8')
            else:
                raise ValueError("Unsupported file format")
            
            # Parse the extracted text
            parsed_data = self._parse_text(text)
            parsed_data['raw_text'] = text
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            raise
    
    def _extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            import io
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            return ""
    
    def _extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            import io
            doc = docx.Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            return ""
    
    def _parse_text(self, text: str) -> Dict[str, Any]:
        """Parse structured data from resume text"""
        result = {
            'name': self._extract_name(text),
            'email': self._extract_email(text),
            'phone': self._extract_phone(text),
            'skills': self._extract_skills(text),
            'experience': self._extract_experience(text),
            'education': self._extract_education(text)
        }
        return result
    
    def _extract_name(self, text: str) -> str:
        """Extract name from resume text"""
        lines = text.strip().split('\n')
        # Usually name is in the first few lines
        for line in lines[:5]:
            line = line.strip()
            if line and len(line.split()) <= 4 and not re.search(r'@|\.com|phone|email', line.lower()):
                # Check if it looks like a name (contains alphabetic characters)
                if re.search(r'[A-Za-z]', line):
                    return line
        return ""
    
    def _extract_email(self, text: str) -> str:
        """Extract email from resume text"""
        emails = re.findall(self.email_pattern, text)
        return emails[0] if emails else ""
    
    def _extract_phone(self, text: str) -> str:
        """Extract phone number from resume text"""
        phones = re.findall(self.phone_pattern, text)
        return phones[0] if phones else ""
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        # Common skill keywords
        skill_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'fastapi', 'spring', 'express', 'mongodb', 'mysql',
            'postgresql', 'redis', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
            'git', 'jenkins', 'ci/cd', 'linux', 'windows', 'macos', 'html', 'css',
            'typescript', 'c++', 'c#', 'go', 'rust', 'scala', 'kotlin', 'swift',
            'machine learning', 'data science', 'artificial intelligence', 'deep learning',
            'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'sql',
            'nosql', 'microservices', 'rest api', 'graphql', 'agile', 'scrum'
        ]
        
        text_lower = text.lower()
        found_skills = []
        
        for skill in skill_keywords:
            if skill.lower() in text_lower:
                # Find the actual case in the original text
                matches = re.findall(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE)
                if matches:
                    found_skills.append(matches[0])
        
        return list(set(found_skills))  # Remove duplicates
    
    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience from resume text"""
        experience = []
        
        # Look for experience section
        experience_section = self._find_section(text, ['experience', 'work history', 'employment'])
        
        if experience_section:
            # Split by potential job entries (look for years or company patterns)
            entries = re.split(r'\n(?=\d{4}|\w+\s+\d{4})', experience_section)
            
            for entry in entries:
                if entry.strip():
                    exp_data = {
                        'description': entry.strip(),
                        'company': self._extract_company_from_entry(entry),
                        'position': self._extract_position_from_entry(entry),
                        'duration': self._extract_duration_from_entry(entry)
                    }
                    if exp_data['company'] or exp_data['position']:
                        experience.append(exp_data)
        
        return experience
    
    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education from resume text"""
        education = []
        
        # Look for education section
        education_section = self._find_section(text, ['education', 'academic', 'qualification'])
        
        if education_section:
            # Common degree patterns
            degree_patterns = [
                r'(bachelor|master|phd|doctorate|b\.?\s?sc|m\.?\s?sc|b\.?\s?tech|m\.?\s?tech|b\.?\s?a|m\.?\s?a)',
                r'(undergraduate|graduate|postgraduate)',
                r'(diploma|certificate)'
            ]
            
            for pattern in degree_patterns:
                matches = re.finditer(pattern, education_section, re.IGNORECASE)
                for match in matches:
                    # Extract context around the match
                    start = max(0, match.start() - 100)
                    end = min(len(education_section), match.end() + 100)
                    context = education_section[start:end].strip()
                    
                    edu_data = {
                        'degree': match.group(),
                        'description': context,
                        'institution': self._extract_institution_from_entry(context)
                    }
                    education.append(edu_data)
        
        return education
    
    def _find_section(self, text: str, keywords: List[str]) -> str:
        """Find a section in the resume text based on keywords"""
        text_lower = text.lower()
        
        for keyword in keywords:
            # Look for the keyword as a section header
            pattern = rf'^.*{keyword}.*$'
            matches = re.finditer(pattern, text_lower, re.MULTILINE)
            
            for match in matches:
                # Find the start of this section
                section_start = match.start()
                
                # Find the next section (look for other common section headers)
                next_sections = re.search(
                    r'\n\s*(skills?|experience|education|projects?|certifications?|achievements?)\s*:?\s*\n',
                    text_lower[section_start + len(match.group()):],
                    re.IGNORECASE
                )
                
                if next_sections:
                    section_end = section_start + len(match.group()) + next_sections.start()
                    return text[section_start:section_end]
                else:
                    # Return rest of the text
                    return text[section_start:]
        
        return ""
    
    def _extract_company_from_entry(self, entry: str) -> str:
        """Extract company name from experience entry"""
        # Look for patterns like "Company Name" or "at Company"
        lines = entry.split('\n')
        for line in lines[:3]:  # Check first few lines
            if 'at ' in line.lower():
                company = line.split('at ')[-1].strip()
                return company.split(',')[0].strip()
            # Look for lines that might be company names (capitalize words)
            words = line.strip().split()
            if len(words) <= 4 and all(word[0].isupper() for word in words if word):
                return line.strip()
        return ""
    
    def _extract_position_from_entry(self, entry: str) -> str:
        """Extract position/title from experience entry"""
        lines = entry.split('\n')
        for line in lines[:2]:  # Check first couple lines
            if any(title_word in line.lower() for title_word in ['engineer', 'developer', 'manager', 'analyst', 'coordinator', 'specialist']):
                return line.strip()
        return ""
    
    def _extract_duration_from_entry(self, entry: str) -> str:
        """Extract duration from experience entry"""
        # Look for year patterns
        year_pattern = r'\d{4}\s*-?\s*(\d{4}|present|current)'
        matches = re.findall(year_pattern, entry, re.IGNORECASE)
        return matches[0] if matches else ""
    
    def _extract_institution_from_entry(self, entry: str) -> str:
        """Extract institution name from education entry"""
        lines = entry.split('\n')
        for line in lines:
            if any(inst_word in line.lower() for inst_word in ['university', 'college', 'institute', 'school']):
                return line.strip()
        return ""
