class Analyzer
  attr_reader :path, :repo, :analyzed_objects

  def initialize(path)
    @path = path
    @repo = Rugged::Repository.new(path)
    @analyzed_objects = []
  end

  def root
    repo.head.target.tree
  end

  def authors
    analyzed_blobs.each_with_object(Set.new) {|blob, authors| authors.merge(blob[:contributions].keys) }
  end

  def analyzed_lines
    analyzed_blobs.sum {|blob| blob[:contributions].values.sum }
  end

  def analyzed_blobs
    analyzed_objects.lazy.select{|o| o[:type] == :blob}
  end

  def analyzed_tree
    analyzed_objects.lazy.select{|o| o[:type] == :tree}
  end

  def analyze!
    @analyzed_objects = []
    analyzed_objects << {type: :tree, oid: root.oid, name: '', filemode: nil}
    analyze_tree(root)
  end

  def analyze_tree(tree, path = nil)
    tree.each do |object|
      analyzed_objects << object
      object[:path] = path && File.join(path, object[:name]) || object[:name]
      object[:parent_oid] = tree.oid

      if object[:type] == :tree
        subtree = repo.lookup(object[:oid])
        analyze_tree(subtree, object[:path])
      else
        analyze_blob(object)
      end
    end
  end

  def analyze_blob(blob)
    puts "Analyzing #{blob[:path]}"

    if should_blame?(blob)
      blame = Rugged::Blame.new(repo, blob[:path])

      blob[:contributions] = blame.each_with_object(Hash.new(0)) do |hunk, counts|
        counts[hunk[:final_signature].slice(:name, :email)] += hunk[:lines_in_hunk]
      end
    else
      blob[:contributions] = {}
    end
  end

  def should_blame?(blob)
    !repo.lookup(blob[:oid]).binary?
  end

  def as_json
    authors_to_ids = Hash[authors.each_with_index.to_a]
    ids_to_authors = Hash[authors_to_ids.map{|k, v| [v, k]}]

    analyzed_json = analyzed_objects.map do |analyzed_object|
      if analyzed_object[:type] == :blob
        contributions_by_id = analyzed_object[:contributions].each_with_object({}) do |(author, count), by_id|
          by_id[authors_to_ids[author]] = count
        end

        analyzed_object.merge(contributions: contributions_by_id)
      else
        analyzed_object
      end
    end

    { root_oid: root.oid, authors: ids_to_authors, analyzed_objects: analyzed_json }
  end
end