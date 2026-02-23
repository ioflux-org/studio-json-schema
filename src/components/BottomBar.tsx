import { BsLinkedin, BsGithub, BsSlack, BsTwitterX } from "react-icons/bs";

const BottomBar = () => {
  return (
    <div className="h-[5vh] bg-[var(--color-bg-inverse)]  px-4 py-1.5 text-[var(--color-text-inverse)]">
      <div className="flex flex-col md:flex-row">
        <div className="w-full">
          Copyright © 2025 visualize-json-schema Authors.
        </div>
        <ul className="flex gap-4">
          <li>
            <a
              href="https://github.com/jagpreetrahi/visualize-json-schema"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-1"
            >
              <BsGithub />
              Github
            </a>
          </li>
          <li>
            <a
              href="https://json-schema.org/slack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-1"
            >
              <BsSlack />
              Slack
            </a>
          </li>
          <li>
            <a
              href="https://x.com/jsonschema"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-1"
            >
              <BsTwitterX />X
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/company/jsonschema/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-1"
            >
              <BsLinkedin />
              Linkedin
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BottomBar;
